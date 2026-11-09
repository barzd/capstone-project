# Inventory Feature Testing Guide

This guide explains how to run and test the inventory feature locally before
merging its pull request.

## Before you start

You will need:

- Python 3.12 or newer
- Node.js and npm
- Access to the team's development MongoDB database
- The project checked out on the pull request branch

Use test data only. Deleting an item from Inventory permanently deletes it.
Check with the database owner before changing or deleting records in a shared
database.

## 1. Configure and start the backend

Open PowerShell in the project folder:

```powershell
cd backend
py -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

If you already have a virtual environment, activate it and install any updated
requirements:

```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create a file named `backend\.env` containing the development MongoDB URI
provided to you:

```text
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.e9ga7jk.mongodb.net/
```
Chris provided these in our messages. Change the respective fields.

Keep the URI private. Do not commit it or paste it into the pull request.

Apply migrations and start Django:

```powershell
python manage.py migrate
python manage.py runserver
```

Leave this terminal running. The backend should be available at
`http://127.0.0.1:8000`.

## 2. Create a Django superuser

Open a second PowerShell terminal in the project folder:

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python manage.py createsuperuser
```

Follow the prompts to set a username, email address, and password. Store the
password securely. If you already have a superuser in your assigned development
database, you can use that account instead.

**Inventory access requires a Django superuser.** The app's prototype sign-in
and regular Django staff accounts do not authorize access to the inventory API.

## 3. Start the frontend

Open a third terminal in the project folder:

```powershell
cd frontend
npm install
npm run dev -- --host 127.0.0.1
```

Leave it running and open `http://127.0.0.1:5173`.

Use `127.0.0.1` consistently for the frontend and backend. Browsers treat
`localhost` and `127.0.0.1` as separate hosts and do not share login cookies.

## 4. Sign in and open Inventory

1. Open the frontend and complete its prototype sign-in screen. This sign-in
   only enters the app; it does not authenticate you with Django.
2. Select **Inventory** in the sidebar.
3. If prompted, select **Sign in to Django admin** or open the Django admin
   login directly at <http://127.0.0.1:8000/admin/> and log in with your
   superuser.
4. You should be redirected back to the app with Inventory selected. Refresh
   Inventory if needed.

The Inventory list shows found items with their name, description, location
found, date found, and storage location. Listing found items is also available
without a Django superuser from Browse Item Reports; deleting items still
requires a superuser.

## 5. Add a test found item

In the app, select **Report Found Item**, enter the test item's details, and
select **Record Found Item**. A successful response displays the generated item
ID; the item is automatically marked available and appears in Inventory.

You can also create a test found item through the Inventory API. Open:

<http://127.0.0.1:8000/api/inventory/>

Use the browsable API's **POST** form to create a test item, for example:

```json
{
  "title": "Test umbrella",
  "description": "Black folding umbrella with a blue handle",
  "category": "Accessories",
  "color": "Black",
  "location": "Library entrance",
  "status": "found",
  "date": "2026-11-03",
  "storage_location": "Admin office, shelf A"
}
```

Only records with `"status": "found"` can be added to Inventory. The API
generates an ID and marks the item available when it saves. Return to the app
and refresh the Inventory view.

## 6. Add a test lost item

Submit the **Report a Lost Item** form in the app, or open
<http://127.0.0.1:8000/api/lost-items/> and use the browsable API's **POST**
form with `"status": "lost"`. Lost reports are listed separately from found
items in Inventory. The Lost Items API rejects reports with any other status.

## 7. View the APIs

Open the Inventory API:

<http://127.0.0.1:8000/api/inventory/>

The endpoint returns found items. Listing and retrieving found items is public;
deleting them requires a Django superuser. The Lost Items API at
<http://127.0.0.1:8000/api/lost-items/> returns only lost reports.

## 8. Test deleting an item

In the app's Inventory table:

1. Select **Delete** next to one of your test items.
2. Confirm the permanent deletion.
3. Verify that the row disappears and is no longer returned by the inventory
   API.

Deletion is permanent. Only delete records you created for testing or records
the team has approved for deletion.

## Useful local URLs

| URL | Purpose |
|---|---|
| <http://127.0.0.1:5173> | Frontend app |
| <http://127.0.0.1:8000/admin/> | Django admin login |
| <http://127.0.0.1:8000/api/lost-items/> | Lost reports API |
| <http://127.0.0.1:8000/api/inventory/> | Found items API; deleting requires a superuser |

## Troubleshooting

| Problem | What to check |
|---|---|
| Connection refused | Confirm Django (`runserver`) and Vite (`npm run dev`) are still running. |
| `KeyError: 'MONGODB_URI'` | Check that `backend\.env` exists, is named `.env` (not `.env.txt`), and defines `MONGODB_URI`. |
| MongoDB authentication error or timeout | Check your development URI and ask the database owner to allow your IP. |
| 403 on Inventory | Sign in through **Sign in to Django admin** with a superuser, then refresh. The prototype login or a regular staff account is not enough. |
| 404 on `/api/inventory/` | Confirm you are on the pull request branch and restart Django so it loads the inventory route. |
| CSRF error when deleting | Restart Django, open the app at `http://127.0.0.1:5173`, sign in again if needed, refresh Inventory, and retry. |
| Changes do not appear | Confirm the frontend and backend terminals are using this checkout and pull request branch. |
