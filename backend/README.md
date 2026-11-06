# Backend — Campus Lost and Found

Django + Django REST Framework, with MongoDB Atlas as the database (via `django-mongodb-backend`).

**Already set up?** Skip to [Already configured: pulling the latest changes](#already-configured-pulling-the-latest-changes).
**First time on this machine?** Start with [First-time setup](#first-time-setup-windows--powershell).

## Already configured: pulling the latest changes

If you already have a `venv` folder and a working `.env` in `backend`, run these each time you pull new code:

```powershell
cd C:\path\to\capstone-project
git pull
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

- `pip install -r requirements.txt` installs any packages a teammate added. If nothing changed, it finishes in a few seconds.
- `python manage.py migrate` applies any database changes a teammate made to the models. If there are none, it says "No migrations to apply."
- You do **not** need to recreate the venv or `.env`. Only redo those if you move to a new computer, delete the `venv` folder, or get a new database password.

If something breaks after pulling, check the [Troubleshooting](#troubleshooting) table at the bottom.

## First-time setup (Windows / PowerShell)

### 1. Install Python

Install **Python 3.12 or newer** from [python.org](https://www.python.org/downloads/).
On the first installer screen, **check "Add python.exe to PATH."** Then close and reopen your terminal and check:

```powershell
py --version
```

### 2. Get the code

```powershell
cd C:\path\to\capstone-project
git pull
cd backend
```

### 3. Create and activate a virtual environment

```powershell
py -m venv venv
.\venv\Scripts\Activate.ps1
```

You should see `(venv)` at the start of your prompt. **Activate it every time you open a new terminal to work on the backend.**

If you get an error saying running scripts is disabled, run this once and try again:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

### 4. Install the dependencies

```powershell
pip install -r requirements.txt
```

### 5. Create your `.env` file

Ask Chris for your own MongoDB database username and password (each teammate gets their own).
In the `backend` folder, create a file named exactly `.env` containing:

```
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.e9ga7jk.mongodb.net/
```

- No spaces around `=`, no quotes, no `< >` brackets.
- If you use Notepad, choose **Save as type: All Files**, or it will save as `.env.txt`.
- **Never commit this file.** It is listed in `.gitignore`. If it ever gets pushed, tell the team right away so the password can be changed.

### 6. Run the server

```powershell
python manage.py migrate
python manage.py runserver
```

Open <http://127.0.0.1:8000/api/lost-items/>. If you see the lost items list,
you're connected.

> `http://127.0.0.1:8000/` on its own shows "Page not found." That's expected — the API lives under `/api/`.

## Everyday workflow

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python manage.py runserver
```

- **Installed a new package?** Run `pip freeze > requirements.txt` and commit it so everyone gets it.
- **Pulled changes that added packages?** Run `pip install -r requirements.txt`.
- **Changed a model?** Run `python manage.py makemigrations` then `python manage.py migrate`, and commit the new migration files.

## Useful URLs

| URL | What it is |
|---|---|
| <http://127.0.0.1:8000/api/lost-items/> | Lost Items API (lost reports only) |
| <http://127.0.0.1:8000/api/inventory/> | Found items API |
| <http://127.0.0.1:8000/admin/> | Django admin (create a login with `python manage.py createsuperuser`) |

## Notes for writing code

MongoDB IDs are strings like `6ae7dd8e3d6b9d44a750106a`, not numbers. Every serializer needs:

```python
id = serializers.CharField(read_only=True)
```

Otherwise the API crashes with `int() argument must be ... not 'ObjectId'`.

## Troubleshooting

| Error | Fix |
|---|---|
| `'py'` or `'python'` is not recognized | Python isn't installed or isn't on PATH — reinstall with "Add to PATH" checked, then reopen the terminal |
| `No module named django` | Your venv isn't active — run `.\venv\Scripts\Activate.ps1` |
| `KeyError: 'MONGODB_URI'` | `.env` is missing, misnamed (`.env.txt`), or not in the `backend` folder |
| `bad auth : authentication failed` | Username or password in `.env` is wrong |
| Timeout / `ServerSelectionTimeoutError` | Your IP isn't allowed in Atlas — ask Chris to check Network Access |
