# teamwork-com.docx — screen-by-screen inventory (all 58 images)

Status: ✅ in app · 🔧 being changed to match · ⛔ needs backend work on the PC first

| # | Reference screen | Details in the image | Status |
|---|---|---|---|
| 1 | Splash | white, logo + spinner | ✅ |
| 2, 23 | Home | avatar + "Home", search, ⋮; Views (⋮) Activity / My work / My day; Recents rows: folder tile, "Project", name, "25 minutes ago"; Shortcuts empty text; + FAB | 🔧 recents row style + time, Views ⋮ |
| 3–6 | Activity | "User ▾" chip, "Choose a user" sheet with search, users grouped by company; "Me ✕" chip; items grouped under project name; avatar with type badge; "X replied to a message", date/time, full body text; empty state | 🔧 body text/badges if the API has them |
| 6–13, 32–35 | My work | avatar title, ⋮, All/Today/Late/Upcoming/Completed, empty state | ✅ |
| 11 | My day | "Hi Umair, Kick back and relax you have no tasks or events today!", + FAB | 🔧 text |
| 12, 37 | Task Lists | title "Task Lists ▾" with icon tile + project; search; "All Lists"; each list with count | 🔧 separate lists page |
| 13–19 | Tasks | "Tasks" + project subtitle, "Search this project", chips All · ✦ · Mine · Today · Late · Upcoming · Completed; ⋮ → Add shortcut / Sort by; "Oops! Nothing found…" | 🔧 ✦ chip |
| 20, 58 | Shortcuts | empty: "No shortcuts…" | ✅ |
| 21, 22 | + FAB speed dial | + opens "Message" action with ✕ | 🔧 speed dial |
| 22 | New message | Choose Project ▾, Message Subject, Type your message here, toolbar 🔔 🔒 🏷 📎 and send | ✅ (🔔🔒🏷 stored once ⛔ backend ships) |
| 24–25, 49 | Projects | avatar title ⋮; Search Projects; Category ▾; company heading; rows: ★ + project name; Sort by sheet from ⋮ | 🔧 rows + Sort in ⋮ |
| 25 | Project categories sheet | "No results / The requested data could not be found." | ✅ |
| 26–28, 57–58 | Notifications | Unread / Read; Catch me up card; "Woohoo! You're all up to date!"; + FAB speed dial | ✅ / 🔧 speed dial |
| 33 | Profile | avatar, name, role badge "Collaborator", company; Logged Time card; View logged time →; Contact Details | ✅ |
| 34 | Account sheet | company, user, Log out, + Add account | ✅ |
| 35 | Settings | Enable push notifications toggle; Version | 🔧 toggle (delivery ⛔ needs Firebase + backend) |
| 36 | Feedback sheet (Home ⋮) | "We'd love to know what you think about the app!" + send | 🔧 (saving ⛔ backend) |
| 37–44 | Project sections | header icon tile + "Section ▾" + project; bottom tab bar stays visible (Projects tab) | 🔧 keep tab bar |
| 38 | Board | "No Tasks — Your board columns will appear here…" | ✅ |
| 39 | Messages | search; grouped by date; author, subject, preview, "4 replies"; + FAB | 🔧 search + FAB |
| 40–41 | Project activity | User ▾ / Me ✕, grouped by date, full text | 🔧 |
| 42 | Files | search; grouped by date; PDF icon; "Jared D. 133 kB"; + FAB | 🔧 search + date groups |
| 43 | File | coloured header, Open file, name, "Jared D. • Oct 30 • V1 • 133 kB", Comments (0), Write a comment | 🔧 comments (⛔ backend) |
| 44–47 | Milestones | All / Late / Upcoming / Completed; empty state | ✅ |
| 48 | Notebooks | empty "No Notebooks Yet" | ✅ |
| 50 | Sort by sheet | Company (Starred First), Name A-Z/Z-A, Last Worked On, Latest Activity, Start/End date, Date Created | 🔧 add Last Worked On / Latest Activity |
| 52–54 | Time | "Time / Umair Test"; "Weekly ▾" dropdown; swipe pages with dots; Billable / Non-billable / Work hours legend; line chart with dashed work hours | 🔧 dropdown + pager |
| 55 | Search Teamwork | search field in the header | 🔧 |
| 56 | Customise Home | ✕ and Done; checkboxes; drag handles; "Inactive sections" | 🔧 inactive list |
| all | Look | dark theme; bottom bar icons, active tab shows pill + label | 🔧 dark default, tab style |
