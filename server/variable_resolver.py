"""
Variable Resolution Utility

Provides generic functionality to resolve variables embedded in text content.
Variables are marked with #{VariableName} format and are replaced with actual values
from the provided user_data dictionary.

This utility is designed to be flexible and reusable across different contexts
throughout the application (messages, templates, notifications, etc.).
"""

import re
from typing import Dict, Any, List, Optional, Callable, Union


class VariableResolverOptions:
    """Configuration options for variable resolution behavior."""
    
    def __init__(
        self,
        default_value: Optional[str] = None,
        remove_unresolved: bool = False,
        preserve_format: bool = False,
        formatter: Optional[Callable[[str, Any], str]] = None,
        case_sensitive: bool = False
    ):
        """
        Initialize variable resolver options.
        
        Args:
            default_value: The default value to use when a variable is not found.
                          If not provided, unresolved variables will be left as-is.
            remove_unresolved: Whether to remove the variable placeholder if not found.
                              If True, #{UnknownVar} will be removed from the text.
            preserve_format: Whether to preserve the variable format (#{}) when using defaultValue.
            formatter: Custom formatter function to transform variable values before insertion.
            case_sensitive: Whether variable matching should be case-sensitive.
                           Default: False (case-insensitive)
        """
        self.default_value = default_value
        self.remove_unresolved = remove_unresolved
        self.preserve_format = preserve_format
        self.formatter = formatter
        self.case_sensitive = case_sensitive


# Regular expression to match variable placeholders in text.
# Matches patterns like #{VariableName}, #{Variable_Name}, #{Variable123}
#
# Pattern breakdown:
# - #\{ - matches literal "#{"
# - ([a-zA-Z_][a-zA-Z0-9_]*) - captures variable name (must start with letter or underscore)
# - \} - matches literal "}"
VARIABLE_PATTERN = re.compile(r'#\{([a-zA-Z_][a-zA-Z0-9_]*)\}')


def resolve_variables(
    text: str,
    user_data: Dict[str, Any],
    options: Optional[Union[VariableResolverOptions, Dict[str, Any]]] = None
) -> str:
    """
    Resolve all variables in the given text with actual values from user_data.
    
    Args:
        text: The text containing variable placeholders (e.g., "Hello #{Name}!")
        user_data: Dictionary containing variable values (e.g., {"Name": "John"})
        options: Optional configuration for resolution behavior (VariableResolverOptions or dict)
    
    Returns:
        The text with all variables resolved to their actual values
    
    Examples:
        >>> resolve_variables("Hello #{Name}!", {"Name": "Alice"})
        'Hello Alice!'
        
        >>> resolve_variables(
        ...     "Hi #{Name}, your email is #{Email}",
        ...     {"Name": "Bob"},
        ...     VariableResolverOptions(default_value="[Not provided]")
        ... )
        'Hi Bob, your email is [Not provided]'
        
        >>> resolve_variables(
        ...     "Hello #{Name} #{UnknownVar}!",
        ...     {"Name": "Charlie"},
        ...     VariableResolverOptions(remove_unresolved=True)
        ... )
        'Hello Charlie !'
    """
    if not text:
        return text
    
    # Convert dict to VariableResolverOptions if needed
    if options is None:
        options = VariableResolverOptions()
    elif isinstance(options, dict):
        options = VariableResolverOptions(**options)
    
    # Create a case-insensitive lookup if needed
    if not options.case_sensitive:
        data_lookup = {k.lower(): k for k in user_data.keys()}
    else:
        data_lookup = {k: k for k in user_data.keys()}
    
    def replace_variable(match: re.Match) -> str:
        """Replace a single variable match with its value."""
        full_match = match.group(0)
        variable_name = match.group(1)
        
        # Get the actual key (with original casing) from user data
        lookup_key = variable_name if options.case_sensitive else variable_name.lower()
        actual_key = data_lookup.get(lookup_key)
        
        # Check if variable exists in user data
        if actual_key and actual_key in user_data:
            value = user_data[actual_key]
            
            # Handle None values
            if value is None:
                if options.remove_unresolved:
                    return ''
                if options.default_value is not None:
                    return full_match if options.preserve_format else options.default_value
                return full_match  # Keep original placeholder
            
            # Apply custom formatter if provided
            if options.formatter:
                return options.formatter(actual_key, value)
            
            # Convert value to string
            return str(value)
        
        # Variable not found - handle based on options
        if options.remove_unresolved:
            return ''
        
        if options.default_value is not None:
            return full_match if options.preserve_format else options.default_value
        
        # Keep original placeholder
        return full_match
    
    return VARIABLE_PATTERN.sub(replace_variable, text)


def extract_variable_names(text: str) -> List[str]:
    """
    Extract all variable names from text (without resolving them).
    Useful for determining which variables are used in a template.
    
    Args:
        text: The text to extract variables from
    
    Returns:
        List of unique variable names found in the text
    
    Examples:
        >>> extract_variable_names("Hello #{Name}, your email is #{Email} and name is #{Name}")
        ['Name', 'Email']
    """
    if not text:
        return []
    
    matches = VARIABLE_PATTERN.findall(text)
    # Return unique variable names (preserve order)
    seen = set()
    unique_vars = []
    for var in matches:
        if var not in seen:
            seen.add(var)
            unique_vars.append(var)
    return unique_vars


def has_variables(text: str) -> bool:
    """
    Check if the given text contains any variable placeholders.
    
    Args:
        text: The text to check
    
    Returns:
        True if text contains at least one variable placeholder
    
    Examples:
        >>> has_variables("Hello #{Name}!")
        True
        >>> has_variables("Hello World!")
        False
    """
    if not text:
        return False
    
    return VARIABLE_PATTERN.search(text) is not None


def validate_variables(text: str) -> Dict[str, Union[bool, List[str]]]:
    """
    Validate variable names in text to ensure they follow naming conventions.
    Variable names must start with a letter or underscore and contain only
    letters, numbers, and underscores.
    
    Args:
        text: The text to validate
    
    Returns:
        Dictionary with validation result and any invalid variable names found
    
    Examples:
        >>> validate_variables("Hello #{Name} and #{123Invalid}")
        {'valid': False, 'invalid_vars': ['123Invalid']}
    """
    # This pattern matches ANY #{...} including invalid ones
    any_variable_pattern = re.compile(r'#\{([^}]+)\}')
    valid_name_pattern = re.compile(r'^[a-zA-Z_][a-zA-Z0-9_]*$')
    
    invalid_vars = []
    matches = any_variable_pattern.findall(text)
    
    for var_name in matches:
        if not valid_name_pattern.match(var_name):
            invalid_vars.append(var_name)
    
    return {
        'valid': len(invalid_vars) == 0,
        'invalid_vars': invalid_vars
    }


def preview_text(text: str, sample_data: Optional[Dict[str, Any]] = None) -> str:
    """
    Preview text with variables resolved, useful for showing users
    what the final text will look like with sample data.
    
    Args:
        text: The text template
        sample_data: Sample variable values for preview
    
    Returns:
        Resolved text with indication of missing variables
    
    Examples:
        >>> preview_text("Welcome #{Name}, email: #{Email}", {"Name": "Alice"})
        'Welcome Alice, email: [Not set]'
    """
    if sample_data is None:
        sample_data = {}
    
    return resolve_variables(
        text,
        sample_data,
        VariableResolverOptions(
            default_value='[Not set]',
            remove_unresolved=False
        )
    )


def batch_resolve_variables(
    texts: List[str],
    user_data: Dict[str, Any],
    options: Optional[Union[VariableResolverOptions, Dict[str, Any]]] = None
) -> List[str]:
    """
    Batch resolve variables in multiple text strings.
    Useful for resolving variables in a set of messages or templates at once.
    
    Args:
        texts: List of text strings to resolve
        user_data: Variable values to use for resolution
        options: Resolution options
    
    Returns:
        List of resolved text strings
    
    Examples:
        >>> batch_resolve_variables(
        ...     ["Hello #{Name}", "Email: #{Email}"],
        ...     {"Name": "Bob", "Email": "bob@example.com"}
        ... )
        ['Hello Bob', 'Email: bob@example.com']
    """
    return [resolve_variables(text, user_data, options) for text in texts]


# Convenience function for common use case: simple resolution with defaults
def simple_resolve(text: str, user_data: Dict[str, Any], default: str = '') -> str:
    """
    Simple variable resolution with a default value for missing variables.
    
    Args:
        text: Text containing variables
        user_data: Variable values
        default: Default value for missing variables (default: empty string)
    
    Returns:
        Resolved text
    
    Examples:
        >>> simple_resolve("Hello #{Name}!", {"Name": "World"})
        'Hello World!'
        >>> simple_resolve("Hello #{Name}!", {}, "[Guest]")
        'Hello [Guest]!'
    """
    return resolve_variables(
        text,
        user_data,
        VariableResolverOptions(default_value=default)
    )
