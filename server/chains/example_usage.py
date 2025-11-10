"""
Simple example showing how to use the Conversational RAG Pipeline
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rag_service import rag_service
from chains.rag_chain import create_conversational_rag


def example_basic():
    """
    Basic usage example
    """
    print("\n" + "="*60)
    print("Example 1: Basic Usage")
    print("="*60 + "\n")
    
    # Create pipeline
    pipeline = create_conversational_rag(
        rag_service=rag_service,
        workspace_id="demo_workspace"
    )
    
    # Ask a question
    answer = pipeline.ask("What is the revenue growth?")
    print(f"Answer: {answer}\n")


def example_with_metadata():
    """
    Example with metadata return
    """
    print("\n" + "="*60)
    print("Example 2: With Metadata")
    print("="*60 + "\n")
    
    # Create pipeline
    pipeline = create_conversational_rag(
        rag_service=rag_service,
        workspace_id="demo_workspace"
    )
    
    # Ask with metadata
    response = pipeline.ask(
        "What is the revenue growth?",
        return_metadata=True
    )
    
    print(f"Answer: {response['answer']}\n")
    print(f"Number of sources: {response['num_sources']}")
    
    if response['source_documents']:
        print("\nSources:")
        for idx, doc in enumerate(response['source_documents'], 1):
            print(f"  {idx}. {doc['filename']} (similarity: {doc['similarity']:.4f})")
    print()


def example_conversation():
    """
    Example conversation with follow-ups
    """
    print("\n" + "="*60)
    print("Example 3: Conversational Flow")
    print("="*60 + "\n")
    
    # Create pipeline
    pipeline = create_conversational_rag(
        rag_service=rag_service,
        workspace_id="demo_workspace",
        memory_k=3  # Keep last 3 conversation turns
    )
    
    # Question 1: Initial query
    print("User: Tell me about Tesla stock.\n")
    answer1 = pipeline.ask("Tell me about Tesla stock.")
    print(f"Assistant: {answer1}\n")
    print("-" * 60 + "\n")
    
    # Question 2: Follow-up (uses context)
    print("User: What was its performance last quarter?\n")
    answer2 = pipeline.ask("What was its performance last quarter?")
    print(f"Assistant: {answer2}\n")
    print("-" * 60 + "\n")
    
    # Question 3: New topic
    print("User: What about Apple?\n")
    answer3 = pipeline.ask("What about Apple?")
    print(f"Assistant: {answer3}\n")
    print("-" * 60 + "\n")
    
    # Check memory stats
    stats = pipeline.get_memory_stats()
    print(f"Memory Stats:")
    print(f"  Conversation turns: {stats['conversation_turns']}")
    print(f"  Total messages: {stats['total_messages']}")
    print()


def example_custom_config():
    """
    Example with custom configuration
    """
    print("\n" + "="*60)
    print("Example 4: Custom Configuration")
    print("="*60 + "\n")
    
    # Create pipeline with custom settings
    pipeline = create_conversational_rag(
        rag_service=rag_service,
        workspace_id="demo_workspace",
        model="gpt-4o",              # Use GPT-4o
        temperature=0.3,              # Lower temperature for factual responses
        top_k=10,                     # Retrieve more documents
        threshold=0.4,                # Lower threshold to get more results
        memory_k=5,                   # Keep more conversation history
        use_prompt_enhancement=True   # Enable context-aware retrieval
    )
    
    answer = pipeline.ask("What are the key financial metrics?")
    print(f"Answer: {answer}\n")


def example_memory_management():
    """
    Example showing memory management
    """
    print("\n" + "="*60)
    print("Example 5: Memory Management")
    print("="*60 + "\n")
    
    # Create pipeline
    pipeline = create_conversational_rag(
        rag_service=rag_service,
        workspace_id="demo_workspace"
    )
    
    # Have a conversation
    pipeline.ask("Tell me about product A.")
    pipeline.ask("What are its features?")
    
    # Check memory
    stats = pipeline.get_memory_stats()
    print(f"Before clearing - Turns: {stats['conversation_turns']}")
    
    # Clear memory
    pipeline.clear_memory()
    
    # Check again
    stats = pipeline.get_memory_stats()
    print(f"After clearing - Turns: {stats['conversation_turns']}")
    print()


def example_error_handling():
    """
    Example with error handling
    """
    print("\n" + "="*60)
    print("Example 6: Error Handling")
    print("="*60 + "\n")
    
    try:
        # Create pipeline
        pipeline = create_conversational_rag(
            rag_service=rag_service,
            workspace_id="demo_workspace"
        )
        
        # Ask question with metadata to capture errors
        response = pipeline.ask(
            "What is the revenue?",
            return_metadata=True
        )
        
        if 'error' in response:
            print(f"Error occurred: {response['error']}")
        else:
            print(f"Answer: {response['answer']}")
            print(f"Sources: {response['num_sources']}")
        
    except Exception as e:
        print(f"Exception: {e}")
    
    print()


if __name__ == "__main__":
    # Run all examples
    print("\n" + "="*60)
    print("🚀 Conversational RAG Pipeline - Usage Examples")
    print("="*60)
    
    # Uncomment the examples you want to run:
    
    # example_basic()
    # example_with_metadata()
    # example_conversation()
    # example_custom_config()
    # example_memory_management()
    # example_error_handling()
    
    # Or run a specific example:
    example_conversation()  # Most comprehensive example
    
    print("\n" + "="*60)
    print("✅ Examples completed!")
    print("="*60 + "\n")
