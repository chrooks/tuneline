#!/usr/bin/env python
"""
Script to remove duplicate scrobbles from the database.
This script should be run before adding the unique constraint.
"""
import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.db.database import Base
from app.models.scrobble import Scrobble

def remove_duplicates():
    """
    Remove duplicate scrobbles from the database.
    A duplicate is defined as having the same user_id, artist, track, and listened_at.
    """
    # Create engine and session
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # First, check for the specific duplicate mentioned in the error
        specific_query = """
        SELECT id, user_id, artist, track, listened_at
        FROM scrobbles
        WHERE user_id = 1 AND artist = 'Noname' AND track = 'All I Need (feat. Xavier Omär)' 
        AND listened_at = '2017-02-04 15:35:10+00'
        ORDER BY id;
        """
        
        specific_result = db.execute(text(specific_query))
        specific_rows = [row for row in specific_result]
        
        print(f"Found {len(specific_rows)} instances of the specific duplicate")
        for row in specific_rows:
            print(f"  ID: {row[0]}, User: {row[1]}, Artist: {row[2]}, Track: {row[3]}, Time: {row[4]}")
        
        # Find all duplicate scrobbles
        query = """
        WITH duplicates AS (
            SELECT id, user_id, artist, track, listened_at,
                   ROW_NUMBER() OVER (
                       PARTITION BY user_id, artist, track, listened_at
                       ORDER BY id
                   ) as row_num
            FROM scrobbles
        )
        SELECT id, user_id, artist, track, listened_at, row_num 
        FROM duplicates 
        WHERE row_num > 1;
        """
        
        result = db.execute(text(query))
        duplicate_rows = [row for row in result]
        duplicate_ids = [row[0] for row in duplicate_rows]
        
        print(f"Found {len(duplicate_ids)} duplicate scrobbles")
        for row in duplicate_rows[:10]:  # Print first 10 duplicates
            print(f"  ID: {row[0]}, User: {row[1]}, Artist: {row[2]}, Track: {row[3]}, Time: {row[4]}, Row: {row[5]}")
        
        if duplicate_ids:
            # Delete duplicates
            for i in range(0, len(duplicate_ids), 100):  # Process in batches of 100
                batch = duplicate_ids[i:i+100]
                db.execute(text(f"DELETE FROM scrobbles WHERE id IN ({','.join(map(str, batch))})"))
                print(f"Deleted batch of {len(batch)} duplicates")
            
            db.commit()
            print("Duplicates removed successfully")
        else:
            print("No duplicates found")
            
    except Exception as e:
        db.rollback()
        print(f"Error removing duplicates: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    remove_duplicates()
