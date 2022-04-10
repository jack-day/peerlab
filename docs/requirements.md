# Requirements
Create a web application that allows university students to share their work for peer review and receive feedback from their peers.

Requirements have been prioritised using MoSCoW Prioritisation. Must-Have and Should-Have requirements will be designed before development begins. Could-Have requirements will be designed and developed iteratively after the Must-Have and Should-Have requirements have been fulfilled.


## Must-Have
These are requirements of which the project guarantees to deliver, they must be completed before deployment.
- Users can submit work to a server for others to review:
    - PDF file
    - Public web link
- Users can get the work of others to review
- Users can enter reviews and feedback
- Users can read reviews of their work
- User Accounts
    - Users can create an account and login
    - User accounts can post multiple pieces of work and reviews
    - Users can view/edit/delete all their posted work and reviews
        - Display if there have been edits and when the last edit was made
- Classes
    - Users can create classes
    - A User can be a teacher or a student in a class
    - Users can invite other users to their class using a generated link
- Class Assignments
    - Teachers can create class assignments
    - Teachers can set a minimum number or reviews that students must complete before a deadline
    - Teachers can set reviews to anonymous or not
    - Teachers can set an assignment deadline
    - Students can submit work for an assignment
- Reviews
    - Students can leave reviews on other students work
    - Reviews will have an overall rating and feedback message


## Should-Have
These are requirements that are important to the project but not vital, leaving these out may be painful but the project is still viable.
- Statistical Reviews
    - Teachers can add custom questions that they would like answered
    - Can be text with optional scale rating or yes/no
    - Teachers can view an analytical/graphical overview of review ratings
- Meta-review
    - Users can upvote/downvote reviews based on it's quality and accuracy
    - Reviews are sorted based on upvotes/downvotes
    - Users can gain/lose reputation points by recieving an upvote/downvote on their review respectively
    - User reputation is shown in the user details of a review


## Could-Have
These are requirements that are desirable but are of minor importance, they leave a lesser impact if left out.
- Notifications
    - Users receive notifications when a review has been posted on a piece of their work
- Assignment Categories
    - Users can create and add categories to their assignments
    - Users can view their assignments by category
- Global Work & Reviews
    - Users can post work for review without being tied to a class assignment
    - Users can post a review on any global work
- Topics
    - Users can create and add topics to their work
    - Users can view all topics and all work within a given topic
- Private Work
    - Users can set work to private to restrict access
    - Users can set and manage a whitelist of users who are allowed to view/review the work
    - Users can get a generated link to send to other users to view/review the work and automatically whitelist them
- Work Discovery
    - Users can search for work by name, topic or author
    - Users can view a feed of all newest work uploaded


## Won't-Have
These are requirements that will not be dispatched at project deployment, but can be considered for future development.
- Review Comments
    - Users can comment on a review
- Social
    - Users can follow other user accounts to view when new work is posted
    - Users receive notifications when a user they follow posts a piece of work