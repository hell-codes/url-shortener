# Slotly — URL Shortening Service

A Data Structures capstone project: a full URL shortening service built on a **hand-written hash table with linear probing**, served through a Flask REST API, with a fully separate static frontend.

## 1. Problem Statement

Long URLs are hard to share, remember, and track. This project builds a service that:

- Converts long URLs into short, shareable codes.
- Stores and retrieves the mapping between short codes and original URLs.
- Redirects visitors from the short link to the original destination.
- Counts clicks per link and persists everything to disk.

The core engineering focus is the **data structure** that powers the mapping: a custom hash table implemented from scratch, without relying on Python's built-in `dict`, using **linear probing** to resolve collisions.

## 2. Features

- Shorten any valid `http`/`https` URL into a 6-character short code.
- Optional custom aliases (e.g. `slotly.dev/my-project`).
- Short URL appears immediately in a success card on the homepage — no page reload, no alert box.
- Copy-to-clipboard and Open actions on every generated link.
- Full history page with click counts, delete, copy, and open actions.
- Click counter incremented on every successful redirect.
- Custom 404 page for missing short codes.
- JSON persistence — restart the Flask server and every link still resolves.
- Custom hash table with linear probing, resizing, and tombstone-based deletion.
- Ambient HTML5 Canvas background visualizing nodes and connections.
- Fully responsive layout (desktop, laptop, tablet, mobile).
- An "About / How It Works" page written for a Data Structures viva, including a live linear-probing demo.

## 3. Architecture

```
                       USER
                         |
                         v
                  STATIC FRONTEND
                (frontend/index.html)
                         |
                 HTML + CSS + JS
                         |
                      fetch()
                         |
                         v
                   FLASK API
                         |
            +------------+------------+
            |                         |
            v                         v
       URL SERVICE               STORAGE LAYER
            |                         |
            v                       JSON FILE
     CUSTOM HASH TABLE
            |
     LINEAR PROBING
            |
            v
      URL MAPPING
            |
            v
      HTTP REDIRECT
```

The frontend and backend are fully decoupled. The frontend never touches `data/urls.json` directly — it only talks to Flask through REST endpoints returning JSON.

## 4. Technologies

| Layer         | Technology                          |
|---------------|--------------------------------------|
| Frontend      | HTML5, CSS3, Vanilla JavaScript      |
| Backend       | Python 3, Flask, Flask-CORS          |
| Data structure| Custom hash table (array + linear probing) |
| Persistence   | JSON file (`data/urls.json`)         |
| Background    | HTML5 Canvas                          |

No frontend framework, no CSS framework, no database.

## 5. Custom Hash Table

Location: `backend/dsa/hash_table.py`

The table stores `(short_code, record)` pairs in a plain Python list acting as an array. It supports:

- `insert(key, value)`
- `search(key)`
- `delete(key)`
- automatic resizing once the load factor passes 0.7
- collision resolution via **linear probing**
- tombstone-based deletion (a `is_deleted` flag) so that later searches can still walk past a deleted slot to reach entries stored further along the same probe chain

### Hash function

```python
hash_value = 0
for character in key:
    hash_value = (hash_value * 31 + ord(character)) % capacity
```

Each character shifts the running hash by a prime multiplier (31) before taking the modulus against the table's current capacity, spreading keys across the array.

### Linear probing example

```
a7K9x -> hash -> index 4   (empty)   -> inserted at 4
b3P2m -> hash -> index 4   (occupied) -> probe to 5 (empty) -> inserted at 5
x8Q1z -> hash -> index 4   (occupied) -> probe to 5 (occupied) -> probe to 6 (empty) -> inserted at 6
```

This exact example is demonstrated live on the **About** page.

## 6. Folder Structure

```
url-shortener/
├── frontend/
│   ├── index.html
│   ├── history.html
│   ├── about.html
│   ├── 404.html
│   ├── css/
│   │   ├── style.css
│   │   ├── index.css
│   │   ├── history.css
│   │   └── about.css
│   ├── js/
│   │   ├── config.js
│   │   ├── canvas.js
│   │   ├── index.js
│   │   ├── history.js
│   │   └── about.js
│   └── assets/icons/
├── backend/
│   ├── app.py
│   ├── dsa/
│   │   ├── __init__.py
│   │   └── hash_table.py
│   ├── services/
│   │   ├── __init__.py
│   │   └── url_service.py
│   ├── storage/
│   │   ├── __init__.py
│   │   └── json_storage.py
│   ├── routes/
│   │   ├── __init__.py
│   │   └── url_routes.py
│   ├── middleware/
│   │   ├── __init__.py
│   │   └── error_handler.py
│   └── tests/
│       ├── test_hash_table.py
│       └── test_url_service.py
├── data/
│   └── urls.json
├── requirements.txt
├── .gitignore
└── README.md
```

## 7. API Endpoints

| Method | Endpoint                  | Description                              |
|--------|----------------------------|-------------------------------------------|
| POST   | `/api/shorten`             | Create a short URL (optional `alias`)     |
| GET    | `/api/urls`                 | List every stored URL record              |
| GET    | `/api/urls/<short_code>`   | Get details for one short code            |
| DELETE | `/api/urls/<short_code>`   | Delete a short code                       |
| GET    | `/api/hashtable/snapshot`  | Inspect current hash table slot state     |
| GET    | `/<short_code>`             | Redirect to the original URL, +1 click    |

### Example: `POST /api/shorten`

Request:

```json
{ "url": "https://example.com/very/long/url" }
```

Response:

```json
{
  "success": true,
  "short_code": "a7K9x",
  "short_url": "http://127.0.0.1:5000/a7K9x",
  "original_url": "https://example.com/very/long/url",
  "created_at": "2026-08-23T00:00:00.000000+00:00",
  "click_count": 0
}
```

## 8. Installation

```bash
git clone <your-repo-url>
cd url-shortener
pip install -r requirements.txt --break-system-packages
```

(Drop `--break-system-packages` if you're using a virtual environment instead.)

### One-click Windows launch

On Windows, double-click `run.bat` in the project root. It creates or reuses `.venv`, installs the backend dependencies, starts both servers, and opens the frontend at `http://127.0.0.1:5500/`.

## 9. Backend Setup & Run

```bash
cd backend
python app.py
```

The API starts at `http://127.0.0.1:5000`.

## 10. Frontend Setup & Run

Opening `frontend/index.html` directly with `file://` can be blocked by browser CORS restrictions. Serve it with a simple static server instead:

```bash
python -m http.server 5500
```

Then open:

```
http://localhost:5500/frontend/
```

The frontend calls the backend using the base URL configured in `frontend/js/config.js`.

## 11. How To Test

Automated tests:

```bash
cd backend
python -m unittest discover -s tests -v
```

Manual tests to try in the browser:

1. Shorten a normal URL — the result card should appear immediately, with no reload.
2. Copy the short URL — button should read "Copied ✓" briefly.
3. Open the short URL — it should redirect to the original site.
4. Visit History — the new link should appear with 1 click after opening it.
5. Delete a link from History — it should disappear and 404 afterward.
6. Enter an invalid URL (e.g. `not-a-url`) — a friendly inline error should appear.
7. Visit a nonexistent short code — the Flask API returns a 404 JSON response.
8. Restart the Flask server — previously created links should still resolve (persistence).
9. Resize the browser window — layout should adapt down to mobile widths.

## 12. Complexity

| Operation | Average case | Worst case |
|-----------|--------------|------------|
| Search    | O(1)         | O(n)       |
| Insert    | O(1)         | O(n)       |
| Delete    | O(1)         | O(n)       |

The worst case occurs when many keys collide and linear probing has to scan a large stretch of the array before finding the target or an open slot. This is why the table automatically resizes once its load factor passes 0.7 — keeping probe chains short on average.

## 13. Future Scope

- Swap JSON storage for SQLite or PostgreSQL for larger-scale persistence.
- Add user accounts so each person only sees their own links.
- Add rate limiting and abuse protection on `/api/shorten`.
- Add QR code generation for each short link.
- Deploy the backend behind a production WSGI server (Gunicorn) and the frontend on static hosting.

## 14. Deployment Concept

- **Frontend**: static files (`frontend/`) can be deployed to any static host (Netlify, Vercel, GitHub Pages, S3).
- **Backend**: `backend/` can be deployed to any Python host (Render, Railway, a VPS with Gunicorn + Nginx).
- Update `API_BASE_URL` in `frontend/js/config.js` to point at the deployed backend URL — it's the single place the base URL is configured.

## 15. Viva Preparation

See the **About / How It Works** page in the app for a full, interactive breakdown, including:

- What is a hash table, and why it was chosen
- What a hash function and a collision are
- What linear probing is, and why it was chosen over chaining
- A live animated demo of three colliding keys being probed into place
- The full insert flow and lookup flow as diagrams
- Time complexity table
- A list of likely examiner questions with prepared answers

## 16. Final Notes

- The core mapping structure is never a Python `dict` — see `backend/dsa/hash_table.py`.
- Flask never renders HTML; it only returns JSON and performs redirects. `frontend/index.html` is the true entry point of the app.
- All code in this project avoids inline comments intentionally — readability comes from clear naming and clean file separation.
