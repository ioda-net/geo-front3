Requirements: you must be able to connect to a webdav server with a username and
a password. On this server you must have access to a KML and another file.

To perform these tests, you must be in drawing mode and select "Save
automatically on custom server".

# File load
1. No url
   - Try to load a KML without a URL.
   - **Result:** a message asking for a URL must be displayed.

2. Wrong file name
   - Enter the correct URL.
   - Enter your credentials
   - Specify a wrong file name.
   - **Result:** a message saying the file cannot be found must be displayed.

3. Wrong credentials
   - Enter the correct URL.
   - Enter the correct filename.
   - Enter either the wrong username or the wrong password.
   - **Result:** a message saying that you are not authorized to load the KML
     must be displayed.

4. Wrong file type
   - Enter the correct URL.
   - Enter the path to a non KML file
   - Enter the correct credentials
   - **Result:** an alert must open saying that this file is not a valid KML.

5. Correct
   - Enter all fields correctly.
   - **Result:** the KML must be displayed.


# File save
1. Existing
   - Enter all fields correctly
   - Start drawing
   - **Result:** the previous KML must be replaced

2. Creating
   - Enter all fields correctly
   - Enter the name of a new KML
   - Start drawing
   - **Result:** the KML must be created


# File delete
1. Features
   - Enter all fields correctly
   - Load a KML
   - Delete part of the drawing
   - **Result:** the KML must be updated

2. File
   - Enter all fields correctly
   - Load a KML
   - Go More > Delete all features
   - **Result:** the KML must be deleted
