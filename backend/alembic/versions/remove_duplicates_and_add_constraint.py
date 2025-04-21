"""Remove duplicates and add unique constraint to scrobbles

Revision ID: remove_duplicates_and_add_constraint
Revises: 246f1f042370
Create Date: 2025-04-05 20:34:54

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import text

# revision identifiers, used by Alembic.
revision = '347f2f042371'  # Shorter revision ID
down_revision = '246f1f042370'  # Set to the previous migration
branch_labels = None
depends_on = None


def upgrade():
    # Create a temporary table to store unique scrobbles
    op.execute("""
    CREATE TEMPORARY TABLE unique_scrobbles AS
    SELECT DISTINCT ON (user_id, artist, track, listened_at) 
        id, user_id, artist, album, track, listened_at, image_url, created_at
    FROM scrobbles
    ORDER BY user_id, artist, track, listened_at, id;
    """)
    
    # Delete all scrobbles
    op.execute("DELETE FROM scrobbles;")
    
    # Insert unique scrobbles back into the table
    op.execute("""
    INSERT INTO scrobbles (id, user_id, artist, album, track, listened_at, image_url, created_at)
    SELECT id, user_id, artist, album, track, listened_at, image_url, created_at
    FROM unique_scrobbles;
    """)
    
    # Drop the temporary table
    op.execute("DROP TABLE unique_scrobbles;")
    
    # Drop the constraint if it exists
    try:
        op.drop_constraint('uix_scrobble_user_track_time', 'scrobbles', type_='unique')
    except:
        pass
    
    # Create the unique constraint
    op.create_unique_constraint('uix_scrobble_user_track_time', 'scrobbles', ['user_id', 'artist', 'track', 'listened_at'])


def downgrade():
    # Drop the unique constraint
    op.drop_constraint('uix_scrobble_user_track_time', 'scrobbles', type_='unique')
