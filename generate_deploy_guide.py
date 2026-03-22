"""Generate FinTrack Deployment Guide PDF"""
from fpdf import FPDF


class DeployGuide(FPDF):
    def header(self):
        if self.page_no() > 1:
            self.set_font("Helvetica", "I", 8)
            self.set_text_color(130, 130, 130)
            self.cell(0, 8, "FinTrack Deployment Guide", align="L")
            self.cell(0, 8, f"Page {self.page_no()}", align="R")
            self.ln(12)

    def footer(self):
        self.set_y(-12)
        self.set_font("Helvetica", "I", 7)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, "FinTrack - Personal Finance Tracker | Deployment Guide", align="C")

    def section_title(self, title):
        self.set_font("Helvetica", "B", 15)
        self.set_text_color(30, 30, 60)
        self.cell(0, 10, title, new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(99, 102, 241)
        self.set_line_width(0.8)
        self.line(10, self.get_y(), 80, self.get_y())
        self.ln(4)

    def sub_title(self, title):
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(50, 50, 80)
        self.cell(0, 8, title, new_x="LMARGIN", new_y="NEXT")
        self.ln(1)

    def body_text(self, text):
        self.set_font("Helvetica", "", 9.5)
        self.set_text_color(40, 40, 40)
        self.multi_cell(0, 5.5, text)
        self.ln(2)

    def step(self, number, text):
        self.set_font("Helvetica", "B", 9.5)
        self.set_text_color(99, 102, 241)
        self.cell(8, 6, f"{number}.")
        self.set_font("Helvetica", "", 9.5)
        self.set_text_color(40, 40, 40)
        self.multi_cell(0, 5.5, text)
        self.ln(1.5)

    def code_block(self, text):
        self.set_fill_color(245, 247, 250)
        self.set_draw_color(220, 225, 235)
        self.set_font("Courier", "", 8.5)
        self.set_text_color(30, 30, 30)
        x = self.get_x()
        y = self.get_y()
        lines = text.strip().split("\n")
        h = len(lines) * 5 + 6
        if y + h > 270:
            self.add_page()
            y = self.get_y()
        self.rect(10, y, 190, h, style="FD")
        self.set_xy(13, y + 3)
        for line in lines:
            self.cell(0, 5, line, new_x="LMARGIN", new_y="NEXT")
            self.set_x(13)
        self.ln(4)

    def note_box(self, text):
        self.set_fill_color(255, 251, 235)
        self.set_draw_color(251, 191, 36)
        y = self.get_y()
        self.rect(10, y, 190, 14, style="FD")
        self.set_xy(14, y + 2)
        self.set_font("Helvetica", "B", 8.5)
        self.set_text_color(120, 80, 0)
        self.cell(0, 5, "NOTE:", new_x="LMARGIN", new_y="NEXT")
        self.set_x(14)
        self.set_font("Helvetica", "", 8.5)
        self.cell(0, 5, text)
        self.ln(18)

    def important_box(self, text):
        self.set_fill_color(254, 242, 242)
        self.set_draw_color(239, 68, 68)
        y = self.get_y()
        lines = text.split("\n")
        h = max(len(lines) * 5.5 + 8, 14)
        if y + h > 270:
            self.add_page()
            y = self.get_y()
        self.rect(10, y, 190, h, style="FD")
        self.set_xy(14, y + 3)
        self.set_font("Helvetica", "B", 8.5)
        self.set_text_color(180, 30, 30)
        self.cell(0, 5, "IMPORTANT:", new_x="LMARGIN", new_y="NEXT")
        self.set_x(14)
        self.set_font("Helvetica", "", 8.5)
        self.set_text_color(120, 30, 30)
        for line in lines:
            self.cell(0, 5.5, line, new_x="LMARGIN", new_y="NEXT")
            self.set_x(14)
        self.set_y(y + h + 4)


def build():
    pdf = DeployGuide()
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.add_page()

    # ---- Cover / Title ----
    pdf.set_fill_color(99, 102, 241)
    pdf.rect(0, 0, 210, 55, "F")
    pdf.set_font("Helvetica", "B", 28)
    pdf.set_text_color(255, 255, 255)
    pdf.set_y(14)
    pdf.cell(0, 12, "FinTrack", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 13)
    pdf.cell(0, 8, "Deployment Guide", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(200, 200, 255)
    pdf.cell(0, 8, "Free hosting with Neon + Render + Vercel", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(20)

    # ---- Overview ----
    pdf.section_title("Overview")
    pdf.body_text(
        "This guide walks you through deploying FinTrack for free using three services:\n\n"
        "  - Neon.tech  -  Free PostgreSQL database (persistent, no expiration)\n"
        "  - Render  -  Free backend hosting (Python/FastAPI)\n"
        "  - Vercel  -  Free frontend hosting (React/Vite)\n\n"
        "Total cost: $0/month. Your data is stored permanently on Neon's PostgreSQL database "
        "and will not be wiped or expired."
    )

    pdf.sub_title("Architecture")
    pdf.body_text(
        "User's Browser  -->  Vercel (React frontend)  -->  Render (FastAPI backend)  -->  Neon (PostgreSQL)\n\n"
        "The frontend is a static site hosted on Vercel. It makes API calls to the FastAPI backend "
        "hosted on Render. The backend connects to a PostgreSQL database on Neon.tech."
    )

    pdf.sub_title("Prerequisites")
    pdf.body_text(
        "- A GitHub account (used to sign into all three services and to deploy from)\n"
        "- The FinTrack project pushed to a GitHub repository\n"
        "- About 15-20 minutes of your time"
    )

    # ---- Step 0: Push to GitHub ----
    pdf.add_page()
    pdf.section_title("Step 0: Push to GitHub")
    pdf.body_text("Before deploying, you need to push the FinTrack project to a GitHub repository.")

    pdf.step(1, "Go to github.com and create a new repository (e.g. 'fintrack'). Keep it empty - don't add README or .gitignore.")
    pdf.step(2, "Open your terminal and navigate to the project folder:")
    pdf.code_block("cd ~/Desktop/AI\\ Projects/finance-tracker")
    pdf.step(3, "Initialize git and push:")
    pdf.code_block(
        "git init\n"
        "git add .\n"
        "git commit -m \"Initial commit\"\n"
        "git branch -M main\n"
        "git remote add origin https://github.com/YOUR_USERNAME/fintrack.git\n"
        "git push -u origin main"
    )
    pdf.note_box("Replace YOUR_USERNAME with your actual GitHub username.")

    # ---- Step 1: Neon ----
    pdf.add_page()
    pdf.section_title("Step 1: Set Up Neon Database")
    pdf.body_text(
        "Neon provides a free PostgreSQL database with no expiration. "
        "Your finance data will be stored here permanently."
    )
    pdf.sub_title("Free Tier Limits")
    pdf.body_text(
        "- 0.5 GB storage (plenty for thousands of transactions)\n"
        "- 190 compute hours/month\n"
        "- No expiration - data persists forever\n"
        "- 1 free project"
    )

    pdf.sub_title("Setup Steps")
    pdf.step(1, "Go to  https://neon.tech  and click 'Sign Up'. Sign in with your GitHub account.")
    pdf.step(2, "Click 'Create Project'. Give it a name like 'fintrack'. Select the region closest to you. Click 'Create Project'.")
    pdf.step(3, "After creation, you'll see a connection string that looks like this:")
    pdf.code_block("postgresql://username:password@ep-xxxx-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require")
    pdf.step(4, "COPY THIS CONNECTION STRING and save it somewhere safe. You will need it in the next step.")
    pdf.important_box("This connection string contains your database password. Do not share it publicly\nor commit it to GitHub. You'll paste it as an environment variable on Render.")

    # ---- Step 2: Render ----
    pdf.add_page()
    pdf.section_title("Step 2: Deploy Backend on Render")
    pdf.body_text(
        "Render will host your FastAPI backend. The free tier includes 750 hours/month "
        "of runtime. The service sleeps after 15 minutes of inactivity and wakes up "
        "in about 30-60 seconds when accessed."
    )
    pdf.sub_title("Free Tier Limits")
    pdf.body_text(
        "- 750 hours/month runtime\n"
        "- 512 MB RAM\n"
        "- Sleeps after 15 min inactivity (30-60s cold start)\n"
        "- 100 GB bandwidth/month"
    )

    pdf.sub_title("Setup Steps")
    pdf.step(1, "Go to  https://render.com  and click 'Get Started'. Sign in with GitHub.")
    pdf.step(2, 'Click "New" then select "Web Service".')
    pdf.step(3, "Connect your GitHub repository (fintrack). Click 'Connect'.")
    pdf.step(4, "Configure the service with these settings:")
    pdf.code_block(
        "Name:            fintrack-api\n"
        "Region:          (pick closest to your Neon region)\n"
        "Branch:          main\n"
        "Root Directory:  backend\n"
        "Runtime:         Python 3\n"
        "Build Command:   pip install -r requirements.txt\n"
        "Start Command:   gunicorn main:app -w 2 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT\n"
        "Instance Type:   Free"
    )
    pdf.step(5, 'Scroll down to "Environment Variables" and add these two:')
    pdf.code_block(
        "Key: DATABASE_URL\n"
        "Value: (paste your Neon connection string from Step 1)\n"
        "\n"
        "Key: FRONTEND_URL\n"
        "Value: (leave blank for now - you'll update this after Step 3)"
    )
    pdf.step(6, 'Click "Create Web Service". Wait for the build to complete (2-5 minutes).')
    pdf.step(7, "Once deployed, Render gives you a URL like:")
    pdf.code_block("https://fintrack-api.onrender.com")
    pdf.step(8, "Test it by visiting this URL in your browser:")
    pdf.code_block("https://fintrack-api.onrender.com/api/health")
    pdf.body_text('You should see:  {"status": "ok"}')
    pdf.note_box("Save your Render URL - you'll need it for the frontend deployment.")

    # ---- Step 3: Vercel ----
    pdf.add_page()
    pdf.section_title("Step 3: Deploy Frontend on Vercel")
    pdf.body_text(
        "Vercel will host your React frontend as a static site with unlimited free bandwidth."
    )
    pdf.sub_title("Free Tier Limits")
    pdf.body_text(
        "- Unlimited static sites\n"
        "- 100 GB bandwidth/month\n"
        "- Automatic HTTPS\n"
        "- Auto-deploys on every git push"
    )

    pdf.sub_title("Setup Steps")
    pdf.step(1, "Go to  https://vercel.com  and click 'Sign Up'. Sign in with GitHub.")
    pdf.step(2, 'Click "Add New Project" then import your fintrack repository.')
    pdf.step(3, "Configure the project:")
    pdf.code_block(
        "Framework Preset:  Vite\n"
        "Root Directory:    frontend\n"
        "Build Command:     npm run build\n"
        "Output Directory:  dist"
    )
    pdf.step(4, 'Expand "Environment Variables" and add:')
    pdf.code_block(
        "Key:   VITE_API_URL\n"
        "Value: https://fintrack-api.onrender.com\n"
        "       (use YOUR actual Render URL from Step 2)"
    )
    pdf.step(5, 'Click "Deploy". Wait for the build to complete (1-2 minutes).')
    pdf.step(6, "Vercel gives you a URL like:")
    pdf.code_block("https://fintrack-xxxxx.vercel.app")
    pdf.step(7, "Visit the URL - you should see the FinTrack login page!")

    # ---- Step 4: Connect ----
    pdf.add_page()
    pdf.section_title("Step 4: Connect Frontend to Backend")
    pdf.body_text(
        "Now you need to tell the backend to accept requests from your Vercel frontend URL."
    )
    pdf.step(1, "Go to your Render dashboard (https://dashboard.render.com).")
    pdf.step(2, "Click on your fintrack-api service.")
    pdf.step(3, 'Go to "Environment" tab.')
    pdf.step(4, "Find the FRONTEND_URL variable and set its value to your Vercel URL:")
    pdf.code_block("FRONTEND_URL=https://fintrack-xxxxx.vercel.app")
    pdf.step(5, 'Click "Save Changes". Render will redeploy automatically.')
    pdf.step(6, "Once redeployed, go to your Vercel URL and test:")
    pdf.body_text(
        "  - Create a new account\n"
        "  - Log in\n"
        "  - Add a transaction\n"
        "  - Check the dashboard\n\n"
        "If everything works, congratulations! Your app is live!"
    )

    # ---- Troubleshooting ----
    pdf.add_page()
    pdf.section_title("Troubleshooting")

    pdf.sub_title("Backend takes a long time to respond")
    pdf.body_text(
        "This is normal on the free tier. Render's free services sleep after 15 minutes of "
        "inactivity. The first request after sleeping takes 30-60 seconds to wake up. "
        "Subsequent requests are fast. This only affects the initial load."
    )

    pdf.sub_title("'Request failed' or CORS errors in the browser console")
    pdf.body_text(
        "Make sure the FRONTEND_URL environment variable on Render matches your exact "
        "Vercel URL (including https://). Also verify VITE_API_URL on Vercel matches "
        "your exact Render URL. Both must NOT have a trailing slash."
    )

    pdf.sub_title("Login/Register returns errors after deployment")
    pdf.body_text(
        "Check that DATABASE_URL on Render is correct. Go to Render > your service > "
        "Logs to see server-side errors. Common issues:\n"
        "  - Incorrect Neon connection string\n"
        "  - Missing ?sslmode=require at the end of the URL"
    )

    pdf.sub_title("Changes not reflecting after git push")
    pdf.body_text(
        "Both Vercel and Render auto-deploy on push to main. Check their dashboards "
        "to see if builds are in progress or if they failed. On Vercel, make sure the "
        "root directory is set to 'frontend'. On Render, make sure it's 'backend'."
    )

    # ---- Quick Reference ----
    pdf.add_page()
    pdf.section_title("Quick Reference")

    pdf.sub_title("Your URLs (fill in after deployment)")
    pdf.code_block(
        "Neon Database:   postgresql://...@....neon.tech/neondb\n"
        "Render Backend:  https://____________.onrender.com\n"
        "Vercel Frontend: https://____________.vercel.app"
    )

    pdf.sub_title("Environment Variables Summary")
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(40, 40, 40)

    # Table header
    pdf.set_fill_color(99, 102, 241)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 8.5)
    pdf.cell(40, 8, "  Platform", fill=True)
    pdf.cell(45, 8, "  Variable", fill=True)
    pdf.cell(95, 8, "  Value", fill=True, new_x="LMARGIN", new_y="NEXT")

    pdf.set_text_color(40, 40, 40)
    pdf.set_font("Helvetica", "", 8.5)

    rows = [
        ("Render", "DATABASE_URL", "Your Neon connection string"),
        ("Render", "FRONTEND_URL", "https://your-app.vercel.app"),
        ("Vercel", "VITE_API_URL", "https://your-app.onrender.com"),
    ]
    for i, (platform, var, val) in enumerate(rows):
        fill = i % 2 == 0
        if fill:
            pdf.set_fill_color(248, 250, 252)
        pdf.cell(40, 7, f"  {platform}", fill=fill)
        pdf.cell(45, 7, f"  {var}", fill=fill)
        pdf.cell(95, 7, f"  {val}", fill=fill, new_x="LMARGIN", new_y="NEXT")

    pdf.ln(8)
    pdf.sub_title("Updating the App")
    pdf.body_text(
        "To update the live app, simply push your changes to GitHub:\n\n"
        "  git add .\n"
        "  git commit -m \"your changes\"\n"
        "  git push\n\n"
        "Both Vercel and Render will automatically detect the push and redeploy."
    )

    pdf.sub_title("Free Tier Summary")
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(40, 40, 40)

    pdf.set_fill_color(99, 102, 241)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 8.5)
    pdf.cell(35, 8, "  Service", fill=True)
    pdf.cell(40, 8, "  Purpose", fill=True)
    pdf.cell(55, 8, "  Limits", fill=True)
    pdf.cell(50, 8, "  Data Expiry", fill=True, new_x="LMARGIN", new_y="NEXT")

    pdf.set_text_color(40, 40, 40)
    pdf.set_font("Helvetica", "", 8.5)

    tiers = [
        ("Neon.tech", "Database", "0.5 GB storage", "Never expires"),
        ("Render", "Backend API", "750 hrs/mo, 512MB", "N/A (stateless)"),
        ("Vercel", "Frontend", "100 GB bandwidth", "N/A (static files)"),
    ]
    for i, (svc, purpose, limits, expiry) in enumerate(tiers):
        fill = i % 2 == 0
        if fill:
            pdf.set_fill_color(248, 250, 252)
        pdf.cell(35, 7, f"  {svc}", fill=fill)
        pdf.cell(40, 7, f"  {purpose}", fill=fill)
        pdf.cell(55, 7, f"  {limits}", fill=fill)
        pdf.cell(50, 7, f"  {expiry}", fill=fill, new_x="LMARGIN", new_y="NEXT")

    # Save
    pdf.output("FinTrack_Deployment_Guide.pdf")
    print("PDF generated: FinTrack_Deployment_Guide.pdf")


if __name__ == "__main__":
    build()
