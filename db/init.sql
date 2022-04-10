CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- Check for empty strings as NOT NULL allows them
CREATE FUNCTION empty(string text)
    RETURNS boolean
    LANGUAGE plpgsql
    AS
$$
    BEGIN
        return TRIM(string) = '';
    END;
$$;


-- Tables
CREATE TABLE usr (
    userID SERIAL PRIMARY KEY,
    uuid uuid NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
    email TEXT NOT NULL CONSTRAINT email_not_null CHECK(NOT empty(email)) UNIQUE,
    fname TEXT NOT NULL CONSTRAINT fname_not_null CHECK(NOT empty(fname)),
    lname TEXT NOT NULL CONSTRAINT lname_not_null CHECK(NOT empty(lname)),
    avatar_mimetype VARCHAR(10) NOT NULL CONSTRAINT avatar_mimetype_not_null CHECK(NOT empty(avatar_mimetype)),
    CONSTRAINT valid_avatar_mimetype CHECK(avatar_mimetype IN ('image/png', 'image/jpeg')),
    join_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE class (
    classID SERIAL PRIMARY KEY,
    short_name TEXT NOT NULL CONSTRAINT short_name_not_null CHECK(NOT empty(short_name)) UNIQUE,
    ownerID INT NOT NULL REFERENCES usr(userID) ON DELETE CASCADE,
    name TEXT NOT NULL CONSTRAINT name_not_null CHECK(NOT empty(name)),
    description TEXT,
    avatar_mimetype VARCHAR(10) NOT NULL CONSTRAINT avatar_mimetype_not_null CHECK(NOT empty(avatar_mimetype)),
    CONSTRAINT valid_avatar_mimetype CHECK(avatar_mimetype IN ('image/png', 'image/jpeg')),
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS class_invite (
    class_inviteUUID uuid DEFAULT uuid_generate_v4() PRIMARY KEY, 
    classID INT NOT NULL REFERENCES class(classID) ON DELETE CASCADE,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE class_usr (
    userID INT NOT NULL REFERENCES usr(userID) ON DELETE CASCADE,
    classID INT NOT NULL REFERENCES class(classID) ON DELETE CASCADE,
    PRIMARY KEY (userID, classID)
);

CREATE TABLE assignment (
    assignmentID SERIAL PRIMARY KEY,
    classID INT NOT NULL REFERENCES class(classID) ON DELETE CASCADE,
    short_name TEXT NOT NULL CONSTRAINT short_name_not_null CHECK(NOT empty(short_name)),
    name TEXT NOT NULL CONSTRAINT name_not_null CHECK(NOT empty(name)),
    description TEXT,
    anonymous BOOLEAN NOT NULL DEFAULT TRUE,
    min_reviews INT NOT NULL,
    rating_max INT NOT NULL DEFAULT 100,
    deadline TIMESTAMP,
    reviews_deadline TIMESTAMP CONSTRAINT valid_reviews_deadline CHECK(reviews_deadline > deadline),
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (classID, short_name)
);

CREATE TABLE work (
    workID SERIAL PRIMARY KEY,
    userID INT NOT NULL REFERENCES usr(userID) ON DELETE CASCADE,
    assignmentID INT NOT NULL REFERENCES assignment(assignmentID) ON DELETE CASCADE,
    uuid uuid NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
    value TEXT NOT NULL CONSTRAINT value_not_null CHECK(NOT empty(value)),
    type CHAR(3) NOT NULL CONSTRAINT valid_type CHECK(type IN ('pdf', 'url')),
    upload_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (userID, assignmentID)
);

CREATE TABLE review (
    userID INT NOT NULL REFERENCES usr(userID) ON DELETE CASCADE,
    workID INT NOT NULL REFERENCES work(workID) ON DELETE CASCADE,
    rating INT NOT NULL,
    feedback TEXT NOT NULL CONSTRAINT feedback_not_null CHECK(NOT empty(feedback)),
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (userID, workID)
);

CREATE TABLE review_like (
    userID INT NOT NULL REFERENCES usr(userID) ON DELETE CASCADE,
    reviewerID INT NOT NULL,
    workID INT NOT NULL,
    is_like BOOLEAN NOT NULL,
    FOREIGN KEY (reviewerID, workID) REFERENCES review (userID, workID) ON DELETE CASCADE,
    PRIMARY KEY (userID, reviewerID, workID)
);
