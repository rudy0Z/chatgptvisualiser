import json
import csv
import pandas as pd
import re
import argparse
import sys
import os
from pathlib import Path

def clean_content(text):
    """
    Clean and normalize text content
    """
    if not text or not isinstance(text, str):
        return ""
    
    # Remove excessive whitespace and normalize
    text = re.sub(r'\s+', ' ', text.strip())
    
    # Remove markdown code block markers
    text = re.sub(r'```[\w]*\n?', '', text)
    
    # Remove excessive newlines
    text = re.sub(r'\n+', ' ', text)
    
    # Remove HTML tags if any
    text = re.sub(r'<[^>]+>', '', text)
    
    # Remove URLs (optional - comment out if you want to keep them)
    # text = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '[URL]', text)
    
    # Remove excessive punctuation
    text = re.sub(r'[.]{3,}', '...', text)
    
    # Remove special unicode characters that might cause issues
    text = re.sub(r'[\u200b-\u200d\ufeff]', '', text)
    
    return text.strip()

def convert_conversations_to_csv(json_file_path, output_csv_path, apply_cleaning=True, minimal_columns=False):
    """
    Convert ChatGPT conversations JSON to CSV with specified columns.
    
    Args:
        json_file_path: Path to input JSON file
        output_csv_path: Path to output CSV file  
        apply_cleaning: Whether to clean and filter data
        minimal_columns: If True, only include columns needed for chat visualizer
                        (id, conversation_id, parent_id, role, content)
    """
    
    # Read the JSON file
    with open(json_file_path, 'r', encoding='utf-8') as f:
        conversations_data = json.load(f)
    
    # List to store all rows
    csv_rows = []
    
    # Process each conversation
    for conversation in conversations_data:
        conversation_id = conversation.get('id', '')
        mapping = conversation.get('mapping', {})
        
        # Process each message in the mapping
        for msg_id, msg_data in mapping.items():
            message = msg_data.get('message')
            
            # Skip if no message data
            if not message:
                continue
            
            # Extract required fields
            row_id = message.get('id', msg_id)
            parent_id = msg_data.get('parent', '')
            author = message.get('author', {})
            role = author.get('role', '') if author else ''
            
            # Extract content
            content_obj = message.get('content', {})
            content_parts = content_obj.get('parts', []) if content_obj else []
            
            # Handle different content types
            content = ''
            if content_parts:
                content_list = []
                for part in content_parts:
                    if isinstance(part, str):
                        content_list.append(part)
                    elif isinstance(part, dict):
                        # Handle structured content (images, etc.)
                        content_list.append(str(part))
                content = ' '.join(content_list)
            
def convert_conversations_to_csv(json_file_path, output_csv_path, apply_cleaning=True, minimal_columns=False):
    """
    Convert ChatGPT conversations JSON to CSV with specified columns.
    Columns: id, conversation_id, parent_id, role, content
    
    Args:
        json_file_path: Path to input JSON file
        output_csv_path: Path for output CSV file
        apply_cleaning: Whether to apply text cleaning (default: True)
    """
    
    print(f"🔄 Processing: {json_file_path}")
    print(f"🧹 Data cleaning: {'Enabled' if apply_cleaning else 'Disabled'}")
    
    # Read the JSON file
    with open(json_file_path, 'r', encoding='utf-8') as f:
        conversations_data = json.load(f)
    
    # List to store all rows
    csv_rows = []
    
    # Statistics for cleaning report
    stats = {
        'total_messages': 0,
        'empty_content_removed': 0,
        'system_messages_removed': 0,
        'duplicates_removed': 0
    }
    
    seen_content = set()  # For duplicate detection
    
    # Process each conversation
    for conversation in conversations_data:
        conversation_id = conversation.get('id', '')
        conversation_title = conversation.get('title', 'Untitled')
        mapping = conversation.get('mapping', {})
        
        # Process each message in the mapping
        for msg_id, msg_data in mapping.items():
            message = msg_data.get('message')
            
            # Skip if no message data
            if not message:
                continue
            
            stats['total_messages'] += 1
            
            # Extract required fields
            row_id = message.get('id', msg_id)
            parent_id = msg_data.get('parent', '')
            author = message.get('author', {})
            role = author.get('role', '') if author else ''
            
            # Extract content
            content_obj = message.get('content', {})
            content_parts = content_obj.get('parts', []) if content_obj else []
            
            # Handle different content types
            content = ''
            if content_parts:
                content_list = []
                for part in content_parts:
                    if isinstance(part, str):
                        content_list.append(part)
                    elif isinstance(part, dict):
                        # Handle structured content (images, etc.)
                        content_list.append(str(part))
                content = ' '.join(content_list)
            
            # Apply cleaning if enabled
            if apply_cleaning:
                content = clean_content(content)
            
            # Skip empty content after cleaning
            if not content or len(content.strip()) < 3:
                stats['empty_content_removed'] += 1
                continue
            
            # Skip system messages with hidden content (optional filter)
            if role == 'system' and message.get('metadata', {}).get('is_visually_hidden_from_conversation'):
                stats['system_messages_removed'] += 1
                continue
            
            # Check for duplicates (optional - based on content similarity)
            content_hash = hash(content.lower()[:100])  # First 100 chars for duplicate detection
            if content_hash in seen_content:
                stats['duplicates_removed'] += 1
                continue
            seen_content.add(content_hash)
            
            # Add additional metadata
            timestamp = message.get('create_time', '')
            status = message.get('status', '')
            
            # Create row with appropriate columns
            if minimal_columns:
                # Only columns needed for chat history visualizer
                row = {
                    'id': row_id,
                    'conversation_id': conversation_id,
                    'parent_id': parent_id,
                    'role': role,
                    'content': content
                }
            else:
                # All columns including metadata
                row = {
                    'id': row_id,
                    'conversation_id': conversation_id,
                    'conversation_title': conversation_title,
                    'parent_id': parent_id,
                    'role': role,
                    'content': content,
                    'timestamp': timestamp,
                    'status': status,
                    'content_length': len(content)
                }
            
            csv_rows.append(row)
    
    # Create DataFrame and save to CSV
    df = pd.DataFrame(csv_rows)
    
    # Additional DataFrame cleaning
    if apply_cleaning:
        # Remove rows with extremely long content (potential data corruption)
        df = df[df['content_length'] < 50000]
        
        # Sort by conversation_id and timestamp for better organization
        df = df.sort_values(['conversation_id', 'timestamp'], na_position='last')
        
        # Reset index
        df = df.reset_index(drop=True)
    
    # Save to CSV
    df.to_csv(output_csv_path, index=False, encoding='utf-8', quoting=csv.QUOTE_MINIMAL)
    
    # Print statistics
    print(f"\n📊 Conversion Statistics:")
    print(f"   Total messages processed: {stats['total_messages']}")
    print(f"   Final rows in CSV: {len(csv_rows)}")
    print(f"   Empty content removed: {stats['empty_content_removed']}")
    print(f"   System messages removed: {stats['system_messages_removed']}")
    print(f"   Duplicates removed: {stats['duplicates_removed']}")
    print(f"   Data retention rate: {len(csv_rows)/stats['total_messages']*100:.1f}%")
    
    print(f"\n✅ Conversion completed!")
    print(f"💾 Output saved to: {output_csv_path}")
    
    # Display summary statistics
    print(f"\n📈 Content Analysis:")
    print(f"   Average content length: {df['content_length'].mean():.0f} characters")
    print(f"   Longest message: {df['content_length'].max()} characters")
    print(f"   Role distribution:")
    role_counts = df['role'].value_counts()
    for role, count in role_counts.items():
        print(f"     {role}: {count} ({count/len(df)*100:.1f}%)")
    
    # Display first few rows as preview
    print(f"\n🔍 Preview of first 3 rows:")
    preview_df = df[['id', 'role', 'content_length', 'content']].head(3)
    for idx, row in preview_df.iterrows():
        content_preview = row['content'][:100] + "..." if len(row['content']) > 100 else row['content']
        print(f"   Row {idx+1}: {row['role']} | {row['content_length']} chars | {content_preview}")
    
    return df

def find_conversations_json(directory=None):
    """
    Find conversations.json file in the given directory or current directory
    """
    if directory is None:
        directory = Path.cwd()
    else:
        directory = Path(directory)
    
    # Look for conversations.json files
    json_files = list(directory.rglob("conversations.json"))
    
    if not json_files:
        # Also look for any JSON files that might contain conversations
        json_files = list(directory.rglob("*.json"))
        json_files = [f for f in json_files if f.stat().st_size > 1000]  # Filter out small files
    
    return json_files

def get_output_paths(input_file, output_dir=None):
    """
    Generate output file paths based on input file
    """
    input_path = Path(input_file)
    
    if output_dir:
        output_dir = Path(output_dir)
    else:
        output_dir = input_path.parent
    
    base_name = input_path.stem
    
    return {
        'csv_raw': output_dir / f"{base_name}_raw.csv",
        'csv_cleaned': output_dir / f"{base_name}_cleaned.csv", 
        'analysis': output_dir / f"{base_name}_analysis.txt"
    }

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="🎯 ChatGPT Conversations JSON to CSV Converter",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python convert_json_to_csv.py                          # Auto-find conversations.json in current directory
  python convert_json_to_csv.py -i conversations.json   # Use specific input file
  python convert_json_to_csv.py -d /path/to/chatgpt     # Search in specific directory
  python convert_json_to_csv.py -i input.json -o output_folder  # Specify output directory
        """
    )
    
    parser.add_argument('-i', '--input', 
                       help='Input JSON file path (if not specified, will auto-search)')
    parser.add_argument('-d', '--directory', 
                       help='Directory to search for conversations.json (default: current directory)')
    parser.add_argument('-o', '--output', 
                       help='Output directory (default: same as input file)')
    parser.add_argument('--raw-only', action='store_true',
                       help='Only create raw CSV (skip cleaned version)')
    parser.add_argument('--cleaned-only', action='store_true', 
                       help='Only create cleaned CSV (skip raw version)')
    parser.add_argument('--minimal', action='store_true',
                       help='Only include columns needed for chat visualizer (id, conversation_id, parent_id, role, content)')
    
    args = parser.parse_args()
    
    print("🎯 ChatGPT Conversations JSON to CSV Converter")
    print("=" * 50)
    
    # Find input file
    if args.input:
        json_file = Path(args.input)
        if not json_file.exists():
            print(f"❌ Error: Input file '{json_file}' not found!")
            sys.exit(1)
    else:
        print("\n🔍 Searching for conversations.json files...")
        search_dir = args.directory if args.directory else Path.cwd()
        found_files = find_conversations_json(search_dir)
        
        if not found_files:
            print(f"❌ No conversations.json files found in '{search_dir}'")
            print("💡 Try specifying a file with: python convert_json_to_csv.py -i /path/to/conversations.json")
            sys.exit(1)
        
        if len(found_files) == 1:
            json_file = found_files[0]
            print(f"✅ Found: {json_file}")
        else:
            print(f"🔍 Found {len(found_files)} JSON files:")
            for i, file in enumerate(found_files, 1):
                size_mb = file.stat().st_size / (1024*1024)
                print(f"  {i}. {file.name} ({size_mb:.1f} MB) - {file.parent}")
            
            try:
                choice = int(input("\nSelect file number: ")) - 1
                json_file = found_files[choice]
            except (ValueError, IndexError):
                print("❌ Invalid selection!")
                sys.exit(1)
    
    # Get output paths
    output_paths = get_output_paths(json_file, args.output)
    
    print(f"\n📁 Input file: {json_file}")
    print(f"📁 Output directory: {output_paths['csv_raw'].parent}")
    
    try:
        # Convert based on options
        if not args.cleaned_only:
            print("\n📝 Converting without cleaning (raw data)...")
            df_raw = convert_conversations_to_csv(json_file, output_paths['csv_raw'], apply_cleaning=False, minimal_columns=args.minimal)
            print(f"✅ Raw CSV saved: {output_paths['csv_raw']}")
        
        if not args.raw_only:
            print("\n🧹 Converting with data cleaning...")
            df_cleaned = convert_conversations_to_csv(json_file, output_paths['csv_cleaned'], apply_cleaning=True, minimal_columns=args.minimal)
            print(f"✅ Cleaned CSV saved: {output_paths['csv_cleaned']}")
        else:
            df_cleaned = df_raw
        
        # Create analysis report
        print(f"\n📋 Creating analysis report...")
        with open(output_paths['analysis'], 'w', encoding='utf-8') as f:
            f.write("ChatGPT Conversations Analysis Report\n")
            f.write("=" * 40 + "\n\n")
            f.write(f"Source file: {json_file}\n")
            f.write(f"Total conversations: {df_cleaned['conversation_id'].nunique()}\n")
            f.write(f"Total messages: {len(df_cleaned)}\n")
            f.write(f"Date range: {pd.to_datetime(df_cleaned['timestamp'], unit='s').min()} to {pd.to_datetime(df_cleaned['timestamp'], unit='s').max()}\n\n")
            f.write("Role Distribution:\n")
            for role, count in df_cleaned['role'].value_counts().items():
                f.write(f"  {role}: {count} messages\n")
            f.write(f"\nAverage message length: {df_cleaned['content_length'].mean():.0f} characters\n")
            f.write(f"Longest message: {df_cleaned['content_length'].max()} characters\n")
        
        print(f"✅ Analysis report saved: {output_paths['analysis']}")
        print("\n🎉 All done! Your conversations are ready for analysis.")
        
    except Exception as e:
        print(f"\n❌ Error processing file: {e}")
        sys.exit(1)
