Login feature is on the branch `login-feature` (not merged yet, please test it).

What's in it: register (first/last name, username, email, password), log in with username or email, forgot/reset password by email, stay logged in after refresh, real logout. Users are stored in MongoDB Atlas.

To run it:
   
1. Backend:
cd /workspaces/capstone-project/backend
source venv/bin/activate
python manage.py runserver

2. Frontend (second terminal):
   cd frontend
   npm run dev

3. Open the 5173 link from the Ports tab.

