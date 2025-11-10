"""
Demo script for testing the Conversational RAG Pipeline
"""
import os
import sys
import logging

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rag_service import rag_service
from chains.rag_chain import create_conversational_rag

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def main():
    """
    Test conversational RAG with example questions
    """
    print("\n" + "="*80)
    print("🤖 Conversational RAG Pipeline Demo")
    print("="*80 + "\n")
    
    # Configuration
    workspace_id = "demo_workspace"  # Replace with actual workspace ID
    
    print(f"📋 Configuration:")
    print(f"   Workspace ID: {workspace_id}")
    print(f"   Model: gpt-4o")
    print(f"   RAG top_k: 5")
    print(f"   Similarity threshold: 0.5")
    print(f"   Memory: 3 turns")
    print(f"   Prompt enhancement: Enabled\n")
    
    # Create conversational RAG pipeline
    print("🚀 Initializing Conversational RAG Pipeline...\n")
    
    try:
        rag_pipeline = create_conversational_rag(
            rag_service=rag_service,
            workspace_id=workspace_id,
            model="gpt-4o",
            temperature=0.7,
            top_k=5,
            threshold=0.5,
            memory_k=3,
            use_prompt_enhancement=True
        )
        
        print("✅ Pipeline initialized successfully!\n")
        
    except Exception as e:
        print(f"❌ Failed to initialize pipeline: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Test questions
    print("\n" + "="*80)
    print("📝 Starting conversation")
    print("="*80 + "\n")
    
    # Question 1: New topic
    print("\n🔵 Question 1: Tell me about Tesla stock.\n")
    try:
        response1 = rag_pipeline.ask(
            "Tell me about Tesla stock.",
            return_metadata=True
        )
        
        print(f"\n📄 Answer:")
        print(f"{response1['answer']}\n")
        
        print(f"📚 Sources used: {response1['num_sources']}")
        for idx, doc in enumerate(response1.get('source_documents', []), 1):
            print(f"   {idx}. {doc['filename']} (similarity: {doc['similarity']:.4f})")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    # Question 2: Related follow-up
    print("\n" + "-"*80)
    print("\n🔵 Question 2: What was its performance last quarter?\n")
    try:
        response2 = rag_pipeline.ask(
            "What was its performance last quarter?",
            return_metadata=True
        )
        
        print(f"\n📄 Answer:")
        print(f"{response2['answer']}\n")
        
        print(f"📚 Sources used: {response2['num_sources']}")
        for idx, doc in enumerate(response2.get('source_documents', []), 1):
            print(f"   {idx}. {doc['filename']} (similarity: {doc['similarity']:.4f})")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    # Question 3: New topic (should not retrieve Tesla info)
    print("\n" + "-"*80)
    print("\n🔵 Question 3: What about Apple?\n")
    try:
        response3 = rag_pipeline.ask(
            "What about Apple?",
            return_metadata=True
        )
        
        print(f"\n📄 Answer:")
        print(f"{response3['answer']}\n")
        
        print(f"📚 Sources used: {response3['num_sources']}")
        for idx, doc in enumerate(response3.get('source_documents', []), 1):
            print(f"   {idx}. {doc['filename']} (similarity: {doc['similarity']:.4f})")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    # Question 4: Follow-up on Apple
    print("\n" + "-"*80)
    print("\n🔵 Question 4: How much did it grow?\n")
    try:
        response4 = rag_pipeline.ask(
            "How much did it grow?",
            return_metadata=True
        )
        
        print(f"\n📄 Answer:")
        print(f"{response4['answer']}\n")
        
        print(f"📚 Sources used: {response4['num_sources']}")
        for idx, doc in enumerate(response4.get('source_documents', []), 1):
            print(f"   {idx}. {doc['filename']} (similarity: {doc['similarity']:.4f})")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    # Memory stats
    print("\n" + "="*80)
    print("\n📊 Memory Statistics:\n")
    stats = rag_pipeline.get_memory_stats()
    print(f"   Total messages: {stats['total_messages']}")
    print(f"   Conversation turns: {stats['conversation_turns']}")
    print(f"   Memory window (k): {stats['memory_k']}")
    print(f"   Has history: {stats['has_history']}")
    
    print("\n" + "="*80)
    print("✅ Demo completed!")
    print("="*80 + "\n")


if __name__ == "__main__":
    main()
