/*==============================================================*/
/* DBMS name:      MySQL 5.0                                    */
/* Created on:     10.05.2019 18:09:16                          */
/*==============================================================*/

drop database if exists health;
create database health;
use health;


/*==============================================================*/
/* Table: Dishes                                                */
/*==============================================================*/
create table Dishes
(
   Dish_ID              int not null auto_increment,
   Dish_name            varchar(128),
   Proteins             real,
   Fats                 real,
   Carbohydrates        real,
   Calories             real,
   Is_public            int,
   primary key (Dish_ID)
);

/*==============================================================*/
/* Table: Dishes_eats                                           */
/*==============================================================*/
create table Dishes_eats
(
   User_dish_ID         int not null auto_increment,
   User_ID              int,
   Dish_ID              int,
   Weight               real,
   Eating_date          datetime,
   Photo_ID             varchar(128),
   primary key (User_dish_ID)
);

/*==============================================================*/
/* Table: Friends                                               */
/*==============================================================*/
create table Friends
(
   First_user_ID        int,
   Second_user_ID       int
);

/*==============================================================*/
/* Table: Friends_requests                                      */
/*==============================================================*/
create table Friends_requests
(
   User_ID_from         int,
   User_ID_to           int
);

/*==============================================================*/
/* Table: Groups_requests                                       */
/*==============================================================*/
create table Groups_requests
(
   User_ID_from         int,
   User_ID_to           int,
   Group_ID             int
);

/*==============================================================*/
/* Table: Groups_users                                          */
/*==============================================================*/
create table Groups_users
(
   User_ID              int,
   Group_ID             int
);

/*==============================================================*/
/* Table: Training_groups                                       */
/*==============================================================*/
create table Training_groups
(
   Group_ID             int not null auto_increment,
   Group_name           varchar(128),
   Group_description    varchar(128),
   Training_ID          int,
   Start_date           datetime,
   primary key (Group_ID)
);

/*==============================================================*/
/* Table: Trainings                                             */
/*==============================================================*/
create table Trainings
(
   Training_ID          int not null auto_increment,
   Training_name        varchar(128),
   Training_description varchar(1024),
   Is_public            int,
   primary key (Training_ID)
);

/*==============================================================*/
/* Table: Trainings_days                                        */
/*==============================================================*/
create table Trainings_days
(
   Training_ID          int,
   Day_number           int,
   Day_plan             varchar(1024)
);

/*==============================================================*/
/* Table: Trainings_users                                       */
/*==============================================================*/
create table Trainings_users
(
   User_ID              int,
   Training_ID          int,
   Start_date           datetime
);

/*==============================================================*/
/* Table: Users                                                 */
/*==============================================================*/
create table Users
(
   User_ID              int not null auto_increment,
   Login                varchar(128),
   Password             varchar(128),
   User_name            varchar(128),
   User_status          varchar(128),
   primary key (User_ID)
);

alter table Dishes_eats add constraint FK_DISHES_E_REFERENCE_USERS foreign key (User_ID)
      references Users (User_ID) on delete restrict on update restrict;

alter table Dishes_eats add constraint FK_DISHES_E_REFERENCE_DISHES foreign key (Dish_ID)
      references Dishes (Dish_ID) on delete restrict on update restrict;

alter table Friends add constraint FK_FRIENDS_REFERENCE_USERS2 foreign key (First_user_ID)
      references Users (User_ID) on delete restrict on update restrict;

alter table Friends add constraint FK_FRIENDS_REFERENCE_USERS1 foreign key (Second_user_ID)
      references Users (User_ID) on delete restrict on update restrict;

alter table Friends_requests add constraint FK_FRIENDS__REFERENCE_USERS foreign key (User_ID_from)
      references Users (User_ID) on delete restrict on update restrict;

alter table Friends_requests add constraint FK_FRIENDS__REFERENCE_USERS2 foreign key (User_ID_to)
      references Users (User_ID) on delete restrict on update restrict;

alter table Groups_requests add constraint FK_GROUPS_R_REFERENCE_USERS foreign key (User_ID_from)
      references Users (User_ID) on delete restrict on update restrict;

alter table Groups_requests add constraint FK_GROUPS_R_REFERENCE_USERS2 foreign key (User_ID_to)
      references Users (User_ID) on delete restrict on update restrict;

alter table Groups_requests add constraint FK_GROUPS_R_REFERENCE_TRAINING foreign key (Group_ID)
      references Training_groups (Group_ID) on delete restrict on update restrict;

alter table Groups_users add constraint FK_GROUPS_U_REFERENCE_USERS foreign key (User_ID)
      references Users (User_ID) on delete restrict on update restrict;

alter table Groups_users add constraint FK_GROUPS_U_REFERENCE_TRAINING foreign key (Group_ID)
      references Training_groups (Group_ID) on delete restrict on update restrict;

alter table Training_groups add constraint FK_TRAINING_REFERENCE_TRAINING foreign key (Training_ID)
      references Trainings (Training_ID) on delete restrict on update restrict;

alter table Trainings_days add constraint FK_TRAINING_D_REFERENCE_TRAINING foreign key (Training_ID)
      references Trainings (Training_ID) on delete restrict on update restrict;

alter table Trainings_users add constraint FK_TRAINING_REFERENCE_USERS foreign key (User_ID)
      references Users (User_ID) on delete restrict on update restrict;

alter table Trainings_users add constraint FK_TRAINING_REFERENCE_TRAINING2 foreign key (Training_ID)
      references Trainings (Training_ID) on delete restrict on update restrict;

