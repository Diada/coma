coma
====

This paper describes the COMA framework. A RAD framework intended to easily build and deploy applications that performs common listing and CRUD operation on business objects.
There are many cases that and application is needed to perform the management of small business such video clubs, internal processes in organizaciones, etc…  these small ERP are not usually covered my the market, and ad hoc projects are usually expensive and buggy.
COMA name stands for COmmon Management Applications.

Goals of COMA
=============

This frameworks need to cover these aspects of software development:

- Build fast applications with basic search and CRUD operations on business objects.
- Offer easily changeable features. The addiction of change of a field must not take more than 5 minutes.
- Solid permissions structure. There may be necessary to define what people can view or edit data. ACL must be based on roles, and granularity based on objects or features.
- Web Based.
- Use of low cost technology. 
- Separation between design and logic.


Steps for building an application with COMA
===========================================

1. Determine business model, with its business objects, features, feature groups and roles.
2. Describe all this logic in an business.xml file located on the server
3. Create the database schema to fold the business logic
4. Design the CRUD and Search pages with Bootstrap (not mandatory to use this framework)
5. Design the site navigation
6. Put ti all together and the application is done.
