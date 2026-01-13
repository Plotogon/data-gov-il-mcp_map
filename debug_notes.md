# Debug Notes - Data Loading Issues

## Issue 1: Police Tab Still Hangs
**Status:** Timeout code is in app.js lines 971-982
**Likely Cause:** Browser cache serving old JS file
**Fix:** Add cache-busting comment or version number to force reload

## Issue 2: Park&Ride Shows <10 Records Instead of 185
**Status:** Investigating
**Possible Causes:**
1. `limit: 500` in datastore_search not enough? (185 should fit)
2. Field mapping errors causing records to be filtered out
3. ITM conversion failing for some coordinates
4. Console logs needed to see actual fetch count

## Issue 3: Missing Datasets
**Searched:** parks, restaurants, museums, theater
**Hebrew queries failed (400 error)** - API doesn't accept Hebrew in URL

**Next Steps:**
- Try organization-based search (Nature & Parks Authority, Ministry of Culture, Ministry of Tourism)
- Search by tags instead of text query
- Look for municipality-specific datasets

## Demo Data Currently Used
- Police: 5 records (demo)
- Bus: 4 records (demo) 
- Hospitals: 10 records (demo)

These are INTENTIONALLY small - not bugs.
