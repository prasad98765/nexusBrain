/**
 * Variable Resolution Utility
 * 
 * Provides generic functionality to resolve variables embedded in text content.
 * Variables are marked with #{VariableName} format and are replaced with actual values
 * from the provided user_data object.
 * 
 * This utility is designed to be flexible and reusable across different contexts
 * throughout the application (messages, templates, notifications, etc.).
 */

export interface VariableResolverOptions {
    /**
     * The default value to use when a variable is not found in user_data.
     * If not provided, unresolved variables will be left as-is in the text.
     */
    defaultValue?: string;
    
    /**
     * Whether to remove the variable placeholder if it's not found.
     * If true, #{UnknownVar} will be removed from the text.
     * If false and no defaultValue is provided, #{UnknownVar} stays as-is.
     */
    removeUnresolved?: boolean;
    
    /**
     * Whether to preserve the variable format (#{}) when using defaultValue.
     * If true, unresolved variables will be shown as "#{VarName}" with defaultValue.
     * If false, only the defaultValue will be shown.
     */
    preserveFormat?: boolean;
    
    /**
     * Custom formatter function to transform variable values before insertion.
     * Useful for formatting dates, numbers, or applying custom transformations.
     */
    formatter?: (key: string, value: any) => string;
    
    /**
     * Case sensitivity for variable matching.
     * If true, #{Name} and #{name} are treated as different variables.
     * Default: false (case-insensitive)
     */
    caseSensitive?: boolean;
}

/**
 * Regular expression to match variable placeholders in text.
 * Matches patterns like #{VariableName}, #{Variable_Name}, #{Variable123}
 * 
 * Pattern breakdown:
 * - #\{ - matches literal "#{"
 * - ([a-zA-Z_][a-zA-Z0-9_]*) - captures variable name (must start with letter or underscore)
 * - \} - matches literal "}"
 * - g flag - global matching to find all occurrences
 */
const VARIABLE_PATTERN = /#\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;

/**
 * Resolves all variables in the given text with actual values from user_data.
 * 
 * @param text - The text containing variable placeholders (e.g., "Hello #{Name}!")
 * @param userData - Object containing variable values (e.g., { Name: "John" })
 * @param options - Optional configuration for resolution behavior
 * @returns The text with all variables resolved to their actual values
 * 
 * @example
 * // Basic usage
 * resolveVariables("Hello #{Name}!", { Name: "Alice" })
 * // Returns: "Hello Alice!"
 * 
 * @example
 * // With default value for missing variables
 * resolveVariables("Hi #{Name}, your email is #{Email}", 
 *   { Name: "Bob" }, 
 *   { defaultValue: "[Not provided]" }
 * )
 * // Returns: "Hi Bob, your email is [Not provided]"
 * 
 * @example
 * // Remove unresolved variables
 * resolveVariables("Hello #{Name} #{UnknownVar}!", 
 *   { Name: "Charlie" }, 
 *   { removeUnresolved: true }
 * )
 * // Returns: "Hello Charlie !"
 * 
 * @example
 * // With custom formatter
 * resolveVariables("Order total: #{Total}", 
 *   { Total: 1234.56 },
 *   { formatter: (key, value) => key === 'Total' ? `$${value.toFixed(2)}` : value }
 * )
 * // Returns: "Order total: $1234.56"
 */
export function resolveVariables(
    text: string,
    userData: Record<string, any>,
    options: VariableResolverOptions = {}
): string {
    if (!text) {
        return text;
    }
    
    const {
        defaultValue,
        removeUnresolved = false,
        preserveFormat = false,
        formatter,
        caseSensitive = false
    } = options;
    
    // Create a case-insensitive lookup map if needed
    const dataLookup = caseSensitive
        ? userData
        : createCaseInsensitiveLookup(userData);
    
    return text.replace(VARIABLE_PATTERN, (match, variableName) => {
        // Get the actual key (with original casing) from user data
        const lookupKey = caseSensitive 
            ? variableName 
            : variableName.toLowerCase();
        
        const actualKey = caseSensitive
            ? variableName
            : Object.keys(userData).find(k => k.toLowerCase() === lookupKey);
        
        // Check if variable exists in user data
        if (actualKey && actualKey in userData) {
            const value = userData[actualKey];
            
            // Handle null or undefined values
            if (value === null || value === undefined) {
                if (removeUnresolved) {
                    return '';
                }
                if (defaultValue !== undefined) {
                    return preserveFormat ? match : defaultValue;
                }
                return match; // Keep original placeholder
            }
            
            // Apply custom formatter if provided
            if (formatter) {
                return formatter(actualKey, value);
            }
            
            // Convert value to string
            return String(value);
        }
        
        // Variable not found - handle based on options
        if (removeUnresolved) {
            return '';
        }
        
        if (defaultValue !== undefined) {
            return preserveFormat ? match : defaultValue;
        }
        
        // Keep original placeholder
        return match;
    });
}

/**
 * Creates a case-insensitive lookup map from user data.
 * This allows matching #{Name}, #{name}, #{NAME} to the same variable.
 */
function createCaseInsensitiveLookup(userData: Record<string, any>): Record<string, any> {
    const lookup: Record<string, any> = {};
    for (const key in userData) {
        lookup[key.toLowerCase()] = userData[key];
    }
    return lookup;
}

/**
 * Extracts all variable names from text (without resolving them).
 * Useful for determining which variables are used in a template.
 * 
 * @param text - The text to extract variables from
 * @returns Array of unique variable names found in the text
 * 
 * @example
 * extractVariableNames("Hello #{Name}, your email is #{Email} and name is #{Name}")
 * // Returns: ["Name", "Email"]
 */
export function extractVariableNames(text: string): string[] {
    if (!text) {
        return [];
    }
    
    const variables = new Set<string>();
    const matches = Array.from(text.matchAll(VARIABLE_PATTERN));
    
    for (const match of matches) {
        variables.add(match[1]);
    }
    
    return Array.from(variables);
}

/**
 * Checks if the given text contains any variable placeholders.
 * 
 * @param text - The text to check
 * @returns true if text contains at least one variable placeholder
 * 
 * @example
 * hasVariables("Hello #{Name}!")  // Returns: true
 * hasVariables("Hello World!")    // Returns: false
 */
export function hasVariables(text: string): boolean {
    if (!text) {
        return false;
    }
    
    return VARIABLE_PATTERN.test(text);
}

/**
 * Validates variable names in text to ensure they follow naming conventions.
 * Variable names must start with a letter or underscore and contain only
 * letters, numbers, and underscores.
 * 
 * @param text - The text to validate
 * @returns Object with validation result and any invalid variable names found
 * 
 * @example
 * validateVariables("Hello #{Name} and #{123Invalid}")
 * // Returns: { valid: false, invalidVars: ["123Invalid"] }
 */
export function validateVariables(text: string): {
    valid: boolean;
    invalidVars: string[];
} {
    // This pattern matches ANY #{...} including invalid ones
    const anyVariablePattern = /#\{([^}]+)\}/g;
    const validNamePattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    
    const invalidVars: string[] = [];
    const matches = Array.from(text.matchAll(anyVariablePattern));
    
    for (const match of matches) {
        const varName = match[1];
        if (!validNamePattern.test(varName)) {
            invalidVars.push(varName);
        }
    }
    
    return {
        valid: invalidVars.length === 0,
        invalidVars
    };
}

/**
 * Preview text with variables resolved, useful for showing users
 * what the final text will look like with sample data.
 * 
 * @param text - The text template
 * @param sampleData - Sample variable values for preview
 * @returns Resolved text with indication of missing variables
 * 
 * @example
 * previewText("Welcome #{Name}, email: #{Email}", { Name: "Alice" })
 * // Returns: "Welcome Alice, email: [Email: Not set]"
 */
export function previewText(
    text: string,
    sampleData: Record<string, any> = {}
): string {
    return resolveVariables(text, sampleData, {
        defaultValue: '[Not set]',
        removeUnresolved: false
    });
}

/**
 * Batch resolve variables in multiple text strings.
 * Useful for resolving variables in a set of messages or templates at once.
 * 
 * @param texts - Array of text strings to resolve
 * @param userData - Variable values to use for resolution
 * @param options - Resolution options
 * @returns Array of resolved text strings
 * 
 * @example
 * batchResolveVariables(
 *   ["Hello #{Name}", "Email: #{Email}"],
 *   { Name: "Bob", Email: "bob@example.com" }
 * )
 * // Returns: ["Hello Bob", "Email: bob@example.com"]
 */
export function batchResolveVariables(
    texts: string[],
    userData: Record<string, any>,
    options: VariableResolverOptions = {}
): string[] {
    return texts.map(text => resolveVariables(text, userData, options));
}
