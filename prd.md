Project Documentation: BizDev & Collaboration Hub
Here's a draft for your project description, Supabase schema, and a development plan.

1. Project Description
Project Title: BizDev & Collaboration Hub

1.1. Overview:
The BizDev & Collaboration Hub is a lightweight, web-based tool designed to provide JS (and supporting team members like IK) with a clear, scannable, and actionable overview of all active and potential Business Development initiatives. It directly addresses the shortcomings of the current Notion-based workflow, which mixes strategic items with tactical tasks, leading to a lack of clarity and difficulty in prioritization for JS.

1.2. Problem Statement:
The existing BizDev workflow, primarily managed in Notion, does not align with JS’s operational needs. Notion is often used as a post-update task list, which JS finds unhelpful for strategic oversight. This misalignment causes:

Lack of a clear, scannable overview of all BizDev initiatives.

Difficulty in distinguishing JS's strategic items from IK's supporting tasks.

Ineffective prioritization.

1.3. Solution:
This tool will provide two primary, interlinked views:

JS BizDev Overview: A comprehensive list of all BizDev projects (clients, opportunities) with key information like name, overall rating, priority, and status. Users can expand projects to see descriptions and associated task lists. This view can also optionally display tasks/projects where Ian is collaborating.

Ian Collaboration Focus: A dedicated view (or filter) specifically highlighting projects and tasks where IK is directly supporting JS (e.g., CTO Club, event management, specific internal processes). These projects may feature more granular tasks and subtasks.

1.4. Key Features (Based on Mockup V3):

Dual List/Tab System: Separate but integrated views for "BizDev Overview" and "Ian Collaboration Focus."

Project Management:

Creation of new BizDev projects with details: Name, Description, Overall Rating, Priority, Status.

"Ian Collaboration" flag for projects.

Task Management:

Ability to add tasks to projects.

Check/uncheck tasks as complete.

Support for subtasks (primarily in Ian Collaboration projects).

Information Display:

Table-like project list view showing: Name, (Total) Rating, Priority, Status.

Expandable project rows to reveal: Description, Task List, Add Task UI.

Detailed Ratings dropdown per project, showing granular components (Revenue Potential, Insider Support, Strategic Fit, etc.) and their weights, plus Runway.

Filtering & Sorting:

Toggle to show/hide "Ian Collaboration" projects within the main BizDev Overview.

Sort projects by Rating, Priority, Status, or Name.

Clear Prioritization: Visual cues (badges) for priority and status.

1.5. Technology Stack:

Frontend: HTML, CSS, JavaScript (Vanilla JS)

Backend & Database: Supabase (PostgreSQL, Realtime, Auth if needed later)

1.6. Goals & Benefits:

Provide JS with a clear, scannable overview of all BizDev initiatives for strategic oversight.

Enable effective prioritization of strategic items.

Offer a dedicated, clear task list for IK's collaborative efforts with JS.

Improve overall workflow efficiency and alignment between JS and IK.

Centralize BizDev project and task tracking in a tool tailored to specific needs.