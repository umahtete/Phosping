I run a business called LuxUp Training located at luxuptraining.com which is the owner of this project. We are positioning ourselves in the market as Course Producers / Distributors. Our primary business model is B2B where we sell our courses to education institutions who then sell to final consumers/students. We provide the platform (Moodle/IOMAD located at courses.luxuptraining.com) for education institutions to deliver purchased courses as a turnkey solution as well.

We aim to make affordable personalised education delivered by AI Tutors a reality.

We have chosen to use OpenMAIC to be our course generator as well as our AI Tutor. These need to be whitelabelled as LuxUp Tutor. OpenMAIC/LuxUp Tutor needs to be integrated with Moodle/IOMAD using LTI 1.3 or other compatible technology so that courses generated can be delivered through Moodle and subsequently sold through IOMAD to our B2B clients.

About OpenMAIC
The OpenMAIC repository generates courses which are stored in the browser cache and therefore 'evaporate' with time. Hence there is a need for persistence stored to store generated courses that can then be deep-linked to from Moodle. To this end, 2 persistent storage volume mounts have been created in coolify with the following paths: /app/data and /app/public/media which you can useas you see fit. A Postgres database has also been integrated to help with persistent storage. I understand it is robust for LTI integration.

For your information, OpenMAIC generates courses which it also calls classrooms. 

OpenMAIC/LuxUp Tutor has been deployed by coolify and is live at tutor.luxuptraining.com

OpenMAIC by default allows anyone to access its homepage and generate courses/classrooms which they can consume immediately. We need to restrict access to the homepage to our in-house team only since it is the course generation page and we need control over it. Students will consume our courses through Moodle/IOMAD and so their access URLs should be appropriately configured to enable access. This is why the phosping code shows access-code code. It was an attempt to restrict access to the homepage. 

As the AI Tutor delivering the courses, OpenMAIC/LuxUp Tutor needs to integrate with Moodle's grading (Assignment and Grade Services, AGS) system to share results/grades.

Then we need to whitelabel OpenMAIC to LuxUp Tutor. LuxUp is a compound word arising from 'Lux' (Latin for Light) and 'Up' so as to mean 'Light Up'. Branding should therefore reflect how we light up the path to personalised learning.

We have a sister webhosting business called SiteONTHEGO located at siteonthego.com that will be provisioning domains and hosting for customers who take up our turnkey 'education delivery website' deal. Credentials for seamless integration into their system are available.