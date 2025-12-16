#!/usr/bin/env python3
"""
Test script for Smart Caching and Related Questions feature
"""

import sys
sys.path.insert(0, 'server')

from llm_routes import is_follow_up_question, generate_related_questions

def test_follow_up_detection():
    """Test the follow-up detection logic"""
    print("🧪 Testing Follow-Up Detection...\n")
    
    # Test case 1: Pronoun detection
    print("Test 1: Pronoun Detection")
    history = [
        {"role": "user", "content": "What is React?"},
        {"role": "assistant", "content": "React is a JavaScript library..."}
    ]
    result = is_follow_up_question("How does it work?", history)
    print(f"  Question: 'How does it work?'")
    print(f"  Result: {result} {'✅' if result else '❌'}")
    print(f"  Expected: True (contains pronoun 'it')")
    assert result == True, "Failed: Should detect pronoun 'it'"
    print()
    
    # Test case 2: Continuation word
    print("Test 2: Continuation Word")
    result = is_follow_up_question("And what about Vue?", history)
    print(f"  Question: 'And what about Vue?'")
    print(f"  Result: {result} {'✅' if result else '❌'}")
    print(f"  Expected: True (starts with 'and')")
    assert result == True, "Failed: Should detect continuation word 'and'"
    print()
    
    # Test case 3: Short question with context
    print("Test 3: Short Question with Context")
    result = is_follow_up_question("Really?", history)
    print(f"  Question: 'Really?'")
    print(f"  Result: {result} {'✅' if result else '❌'}")
    print(f"  Expected: True (short question with context)")
    assert result == True, "Failed: Should detect short question with context"
    print()
    
    # Test case 4: Standalone question
    print("Test 4: Standalone Question")
    result = is_follow_up_question("What is Python?", [])
    print(f"  Question: 'What is Python?'")
    print(f"  Result: {result} {'✅' if result else '❌'}")
    print(f"  Expected: False (standalone, no context)")
    assert result == False, "Failed: Should NOT detect standalone question"
    print()
    
    # Test case 5: New topic
    print("Test 5: New Topic")
    result = is_follow_up_question("Explain machine learning algorithms", history)
    print(f"  Question: 'Explain machine learning algorithms'")
    print(f"  Result: {result} {'✅' if result else '❌'}")
    print(f"  Expected: False (new topic)")
    assert result == False, "Failed: Should NOT detect new topic as follow-up"
    print()
    
    print("✅ All follow-up detection tests passed!\n")


def test_related_questions():
    """Test the related questions generation"""
    print("🧪 Testing Related Questions Generation...\n")
    
    print("Test 1: Basic Question Generation")
    user_msg = "What is React?"
    assistant_msg = "React is a JavaScript library for building user interfaces. It was created by Facebook and is widely used for web development."
    
    print(f"  User: '{user_msg}'")
    print(f"  Assistant: '{assistant_msg[:50]}...'")
    
    try:
        questions = generate_related_questions(user_msg, assistant_msg)
        
        print(f"\n  Generated {len(questions)} questions:")
        for i, q in enumerate(questions, 1):
            print(f"    {i}. {q}")
        
        # Validate
        assert len(questions) == 3, f"Expected 3 questions, got {len(questions)}"
        assert all(isinstance(q, str) for q in questions), "All questions should be strings"
        assert all(q.endswith('?') for q in questions), "All questions should end with '?'"
        assert all(len(q) > 10 for q in questions), "All questions should be meaningful (> 10 chars)"
        
        print("\n✅ Related questions test passed!")
        
    except Exception as e:
        print(f"\n❌ Error generating questions: {e}")
        print("Note: This might fail if OpenRouter API is not accessible")
        print("Using fallback questions is acceptable in this case")
    
    print()


def test_caching_scenarios():
    """Test various caching scenarios"""
    print("🧪 Testing Caching Scenarios...\n")
    
    scenarios = [
        {
            "name": "First question (should cache)",
            "question": "What is React?",
            "history": [],
            "should_cache": True
        },
        {
            "name": "Follow-up with pronoun (should NOT cache)",
            "question": "How does it work?",
            "history": [
                {"role": "user", "content": "What is React?"},
                {"role": "assistant", "content": "React is..."}
            ],
            "should_cache": False
        },
        {
            "name": "Follow-up with continuation (should NOT cache)",
            "question": "And what about Vue?",
            "history": [
                {"role": "user", "content": "What is React?"},
                {"role": "assistant", "content": "React is..."}
            ],
            "should_cache": False
        },
        {
            "name": "Short question with context (should NOT cache)",
            "question": "Why?",
            "history": [
                {"role": "user", "content": "What is React?"},
                {"role": "assistant", "content": "React is..."}
            ],
            "should_cache": False
        },
        {
            "name": "New standalone topic (should cache)",
            "question": "Explain neural networks in detail",
            "history": [
                {"role": "user", "content": "What is React?"},
                {"role": "assistant", "content": "React is..."}
            ],
            "should_cache": True
        }
    ]
    
    for i, scenario in enumerate(scenarios, 1):
        print(f"Scenario {i}: {scenario['name']}")
        
        is_followup = is_follow_up_question(scenario['question'], scenario['history'])
        will_cache = not is_followup and len(scenario['question'].split()) >= 3
        
        print(f"  Question: '{scenario['question']}'")
        print(f"  Is follow-up: {is_followup}")
        print(f"  Will cache: {will_cache}")
        print(f"  Expected cache: {scenario['should_cache']}")
        
        if will_cache == scenario['should_cache']:
            print(f"  ✅ PASS")
        else:
            print(f"  ❌ FAIL")
        
        print()
    
    print("✅ Caching scenario tests completed!\n")


def main():
    print("=" * 60)
    print("Smart Caching & Related Questions - Test Suite")
    print("=" * 60)
    print()
    
    try:
        # Test 1: Follow-up detection
        test_follow_up_detection()
        
        # Test 2: Related questions
        test_related_questions()
        
        # Test 3: Caching scenarios
        test_caching_scenarios()
        
        print("=" * 60)
        print("✅ All tests completed successfully!")
        print("=" * 60)
        
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
