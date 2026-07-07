### Short Version Installation Steps

Source: https://www.postgresql.org/docs/19/install-meson.html

This is a condensed sequence of commands for building and installing PostgreSQL using Meson. It includes configuration, compilation, installation, user setup, data directory initialization, and basic server start.

```bash
meson setup build --prefix=/usr/local/pgsql
cd build
ninja
su
ninja install
adduser postgres
mkdir -p /usr/local/pgsql/data
chown postgres /usr/local/pgsql/data
su - postgres
/usr/local/pgsql/bin/initdb -D /usr/local/pgsql/data
/usr/local/pgsql/bin/pg_ctl -D /usr/local/pgsql/data -l logfile start
/usr/local/pgsql/bin/createdb test
/usr/local/pgsql/bin/psql test

```

--------------------------------

### Basic Configuration

Source: https://www.postgresql.org/docs/19/install-make.html

Run the configure script for a default installation setup.

```bash
./configure

```

--------------------------------

### OpenBSD Autostart Script Snippet

Source: https://www.postgresql.org/docs/19/server-start.html

Example configuration for starting PostgreSQL on OpenBSD by adding commands to '/etc/rc.local'. Ensures the server is started with appropriate checks and logging.

```bash
if [ -x /usr/local/pgsql/bin/pg_ctl -a -x /usr/local/pgsql/bin/postgres ]; then
    su -l postgres -c '/usr/local/pgsql/bin/pg_ctl start -s -l /var/postgresql/log -D /usr/local/pgsql/data'
    echo -n ' postgresql'
fi
```

--------------------------------

### libpq Example Program 1

Source: https://www.postgresql.org/docs/current/libpq-example.html

Demonstrates connecting to a PostgreSQL database, setting the search path, starting a transaction, declaring and fetching data using a cursor, and closing the connection. This example is useful for understanding basic database operations with libpq.

```c
#include <stdio.h>
#include <stdlib.h>
#include "libpq-fe.h"

static void
exit_nicely(PGconn *conn)
{
    PQfinish(conn);
    exit(1);
}

int
main(int argc, char **argv)
{
    const char *conninfo;
    PGconn     *conn;
    PGresult   *res;
    int         nFields;
    int         i,
                j;

    /*
     * If the user supplies a parameter on the command line, use it as the
     * conninfo string; otherwise default to setting dbname=postgres and using
     * environment variables or defaults for all other connection parameters.
     */
    if (argc > 1)
        conninfo = argv[1];
    else
        conninfo = "dbname = postgres";

    /* Make a connection to the database */
    conn = PQconnectdb(conninfo);

    /* Check to see that the backend connection was successfully made */
    if (PQstatus(conn) != CONNECTION_OK)
    {
        fprintf(stderr, "%s", PQerrorMessage(conn));
        exit_nicely(conn);
    }

    /* Set always-secure search path, so malicious users can't take control. */
    res = PQexec(conn,
                 "SELECT pg_catalog.set_config('search_path', '', false)");
    if (PQresultStatus(res) != PGRES_TUPLES_OK)
    {
        fprintf(stderr, "SET failed: %s", PQerrorMessage(conn));
        PQclear(res);
        exit_nicely(conn);
    }

    /*
     * Should PQclear PGresult whenever it is no longer needed to avoid memory
     * leaks
     */
    PQclear(res);

    /*
     * Our test case here involves using a cursor, for which we must be inside
     * a transaction block.  We could do the whole thing with a single
     * PQexec() of "select * from pg_database", but that's too trivial to make
     * a good example.
     */

    /* Start a transaction block */
    res = PQexec(conn, "BEGIN");
    if (PQresultStatus(res) != PGRES_COMMAND_OK)
    {
        fprintf(stderr, "BEGIN command failed: %s", PQerrorMessage(conn));
        PQclear(res);
        exit_nicely(conn);
    }
    PQclear(res);

    /*
     * Fetch rows from pg_database, the system catalog of databases
     */
    res = PQexec(conn, "DECLARE myportal CURSOR FOR select * from pg_database");
    if (PQresultStatus(res) != PGRES_COMMAND_OK)
    {
        fprintf(stderr, "DECLARE CURSOR failed: %s", PQerrorMessage(conn));
        PQclear(res);
        exit_nicely(conn);
    }
    PQclear(res);

    res = PQexec(conn, "FETCH ALL in myportal");
    if (PQresultStatus(res) != PGRES_TUPLES_OK)
    {
        fprintf(stderr, "FETCH ALL failed: %s", PQerrorMessage(conn));
        PQclear(res);
        exit_nicely(conn);
    }

    /* first, print out the attribute names */
    nFields = PQnfields(res);
    for (i = 0; i < nFields; i++)
        printf("% -15s", PQfname(res, i));
    printf("\n\n");

    /* next, print out the rows */
    for (i = 0; i < PQntuples(res); i++)
    {
        for (j = 0; j < nFields; j++)
            printf("% -15s", PQgetvalue(res, i, j));
        printf("\n");
    }

    PQclear(res);

    /* close the portal ... we don't bother to check for errors ... */
    res = PQexec(conn, "CLOSE myportal");
    PQclear(res);

    /* end the transaction */
    res = PQexec(conn, "END");
    PQclear(res);

    /* close the connection to the database and cleanup */
    PQfinish(conn);

    return 0;
}

```

--------------------------------

### Meson Setup with Custom Prefix

Source: https://www.postgresql.org/docs/19/install-meson.html

Configures the build directory with a custom installation prefix. This allows specifying a non-default location for installed files.

```bash
meson setup build --prefix=/home/user/pg-install

```

--------------------------------

### Full Procedure Example: SELECT current_database()

Source: https://www.postgresql.org/docs/19/ecpg-sql-get-descriptor.html

This comprehensive example demonstrates executing a query, allocating a descriptor, fetching results into the descriptor, and then using GET DESCRIPTOR to retrieve the column count, data length, and data for the 'current_database()' query. It includes connection, cursor management, and deallocation.

```ecpg
int
main(void)
{
EXEC SQL BEGIN DECLARE SECTION;
    int  d_count;
    char d_data[1024];
    int  d_returned_octet_length;
EXEC SQL END DECLARE SECTION;

    EXEC SQL CONNECT TO testdb AS con1 USER testuser;
    EXEC SQL SELECT pg_catalog.set_config('search_path', '', false); EXEC SQL COMMIT;
    EXEC SQL ALLOCATE DESCRIPTOR d;

    /* Declare, open a cursor, and assign a descriptor to the cursor  */
    EXEC SQL DECLARE cur CURSOR FOR SELECT current_database();
    EXEC SQL OPEN cur;
    EXEC SQL FETCH NEXT FROM cur INTO SQL DESCRIPTOR d;

    /* Get a number of total columns */
    EXEC SQL GET DESCRIPTOR d :d_count = COUNT;
    printf("d_count                 = %d\n", d_count);

    /* Get length of a returned column */
    EXEC SQL GET DESCRIPTOR d VALUE 1 :d_returned_octet_length = RETURNED_OCTET_LENGTH;
    printf("d_returned_octet_length = %d\n", d_returned_octet_length);

    /* Fetch the returned column as a string */
    EXEC SQL GET DESCRIPTOR d VALUE 1 :d_data = DATA;
    printf("d_data                  = %s\n", d_data);

    /* Closing */
    EXEC SQL CLOSE cur;
    EXEC SQL COMMIT;

    EXEC SQL DEALLOCATE DESCRIPTOR d;
    EXEC SQL DISCONNECT ALL;

    return 0;
}

```

--------------------------------

### Short Version Installation Steps

Source: https://www.postgresql.org/docs/19/install-make.html

A condensed sequence of commands for a quick installation of PostgreSQL from source.

```bash
./configure
make
su
make install
adduser postgres
mkdir -p /usr/local/pgsql/data
chown postgres /usr/local/pgsql/data
su - postgres
/usr/local/pgsql/bin/initdb -D /usr/local/pgsql/data
/usr/local/pgsql/bin/pg_ctl -D /usr/local/pgsql/data -l logfile start
/usr/local/pgsql/bin/createdb test
/usr/local/pgsql/bin/psql test

```

--------------------------------

### Install PostgreSQL World (including docs)

Source: https://www.postgresql.org/docs/19/install-make.html

Installs the entire PostgreSQL build, including documentation.

```bash
make install-world
```

--------------------------------

### Build and Install All Contrib Modules

Source: https://www.postgresql.org/docs/19/contrib.html

To build and install all optional components from the 'contrib' directory, navigate to the 'contrib' directory in a configured source tree and run 'make' followed by 'make install'.

```bash
**make**
**make install**
```

--------------------------------

### Install PostgreSQL World (binaries only)

Source: https://www.postgresql.org/docs/19/install-make.html

Installs the PostgreSQL binaries without documentation. Use this if documentation was not built.

```bash
make install-world-bin
```

--------------------------------

### Build and Install All Contrib Modules

Source: https://www.postgresql.org/docs/current/contrib.html

Run 'make' and 'make install' in the 'contrib' directory to build and install all optional components. Ensure the PostgreSQL source tree is configured first.

```bash
make
make install
```

--------------------------------

### Install PostgreSQL Documentation

Source: https://www.postgresql.org/docs/19/install-make.html

Installs the HTML and man page documentation for PostgreSQL.

```bash
make install-docs
```

--------------------------------

### Starting a Transaction Block in PostgreSQL

Source: https://www.postgresql.org/docs/current/sql-begin.htm

This example demonstrates the basic usage of the BEGIN command to initiate a transaction block in PostgreSQL.

```sql
BEGIN;
```

--------------------------------

### Install New PostgreSQL Binaries from Source

Source: https://www.postgresql.org/docs/19/pgupgrade.html

For source installations, use the 'make prefix' command to specify a custom installation location for the new PostgreSQL binaries and support files.

```bash
make prefix=/usr/local/pgsql.new install
```

--------------------------------

### PL/pgSQL Variable Initialization Examples

Source: https://www.postgresql.org/docs/19/plpgsql-declarations.html

Examples of initializing variables with default values, using :=, and declaring constants with specific initializations.

```plpgsql
quantity integer DEFAULT 32;
url varchar := 'http://mysite.com';
transaction_time CONSTANT timestamp with time zone := now();

```

--------------------------------

### Check Connection Status of PostgreSQL Server During Startup

Source: https://www.postgresql.org/docs/19/app-pg-isready.html

This example shows how to use pg_isready with specific host and port parameters to check the connection status of a PostgreSQL server that is currently starting up. The output 'rejecting connections' and exit status 1 indicate that the server is not yet ready.

```bash
$ pg_isready -h localhost -p 5433
localhost:5433 - rejecting connections
$ echo $? 
1
```

--------------------------------

### libpq Binary I/O and Out-of-Line Parameters Example

Source: https://www.postgresql.org/docs/19/libpq-example.html

This C program demonstrates libpq's capabilities for handling out-of-line parameters and performing binary input/output operations. It requires a specific database schema and data setup.

```c
/*
 * src/test/examples/testlibpq3.c
 *
 *
 * testlibpq3.c
 *      Test out-of-line parameters and binary I/O.
 *
 * Before running this, populate a database with the following commands
 * (provided in src/test/examples/testlibpq3.sql):
 *
 * CREATE SCHEMA testlibpq3;
 * SET search_path = testlibpq3;
 * CREATE TABLE test1 (i int4, t text, b bytea);
 * INSERT INTO test1 values (1, 'joe''s place', '\000\001\002\003\004');
 * INSERT INTO test1 values (2, 'ho there', '\004\003\002\001\000');
 *
 * The expected output is:
 *
 * tuple 0: got
 *  i = (4 bytes) 1
 *  t = (11 bytes) 'joe's place'
 *  b = (5 bytes) \000\001\002\003\004
 *
 * tuple 0: got
 *  i = (4 bytes) 2
 *  t = (8 bytes) 'ho there'
 *  b = (5 bytes) \004\003\002\001\000
 */

#ifdef WIN32
#include <windows.h>
#endif

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>
#include <sys/types.h>
#include "libpq-fe.h"

/* for ntohl/htonl */
#include <netinet/in.h>
#include <arpa/inet.h>

```

--------------------------------

### Start PostgreSQL Server on Solaris

Source: https://www.postgresql.org/docs/19/server-start.html

This command starts the PostgreSQL server using pg_ctl on Solaris systems. Ensure the path to pg_ctl and the data directory are correct for your installation.

```bash
su - postgres -c "/usr/local/pgsql/bin/pg_ctl start -l logfile -D /usr/local/pgsql/data"
```

--------------------------------

### Create User Mapping Example

Source: https://www.postgresql.org/docs/19/sql-createusermapping.html

Example of creating a user mapping for a specific user 'bob' to a server named 'foo', including authentication details.

```sql
CREATE USER MAPPING FOR bob SERVER foo OPTIONS (user 'bob', password 'secret');

```

--------------------------------

### Benchmark Setup and Execution

Source: https://www.postgresql.org/docs/19/intarray.html

Demonstrates the steps to set up a test database, create the intarray extension, populate test data, and run the benchmark script for the intarray extension.

```bash
cd .../contrib/intarray/bench
createdb TEST
psql -c "CREATE EXTENSION intarray" TEST
./create_test.pl | psql TEST
./bench.pl
```

--------------------------------

### PL/pgSQL GET DIAGNOSTICS Example

Source: https://www.postgresql.org/docs/19/plpgsql-statements.html

An example of using GET DIAGNOSTICS to retrieve the number of rows processed by the most recent SQL command into an integer variable.

```plpgsql
GET DIAGNOSTICS integer_var = ROW_COUNT;

```

--------------------------------

### PL/pgSQL GET DIAGNOSTICS Example for ROW_COUNT

Source: https://www.postgresql.org/docs/current/plpgsql-statements.html

An example of using GET DIAGNOSTICS to retrieve the number of rows processed by the most recent SQL command into an integer variable.

```plpgsql
GET DIAGNOSTICS integer_var = ROW_COUNT;
```

--------------------------------

### Disable RPATH for Relocatable Installs

Source: https://www.postgresql.org/docs/19/install-meson.html

Use this option with 'meson setup' to ensure the installation is relocatable, meaning it can be moved after installation without issues.

```bash
meson setup -Drpath=false

```

--------------------------------

### pg_ctl start

Source: https://www.postgresql.org/docs/19/app-pg-ctl.html

Starts a PostgreSQL server instance. This command brings the database server online.

```APIDOC
## pg_ctl start

### Description
Starts a PostgreSQL server instance.

### Method
Command-line utility

### Endpoint
`pg_ctl start`

### Parameters
#### Path Parameters
- **-D** _datadir_ (string) - Required - Specifies the data directory of the server to start.
- **-l** _filename_ (string) - Optional - Specifies a file to which the server log output should be directed.
- **-W** (boolean) - Optional - Prompts for the server's administrator password before starting.
- **-t** _seconds_ (integer) - Optional - Specifies the maximum time in seconds to wait for the server to start.
- **-s** (boolean) - Optional - Suppresses normal output.
- **-o** _options_ (string) - Optional - Specifies options to be passed to the server executable.
- **-p** _path_ (string) - Optional - Specifies the path to the server executable.
- **-c** (boolean) - Optional - Enables control of the server via `pg_ctl`'s control socket.

### Request Example
```bash
pg_ctl start -D /var/lib/pgsql/data -l /var/log/postgresql.log
```

### Response
#### Success Response
Starts the PostgreSQL server successfully.

#### Response Example
(No specific response format is detailed, success is indicated by completion without error.)
```

--------------------------------

### Get Current Timestamp (Transaction Start)

Source: https://www.postgresql.org/docs/current/functions-datetime.html

Retrieves the current date and time, representing the start of the current transaction.

```sql
SELECT current_timestamp;
```

--------------------------------

### Get Current Timestamp with Limited Precision (Transaction Start)

Source: https://www.postgresql.org/docs/current/functions-datetime.html

Retrieves the current date and time (start of transaction) with a specified precision.

```sql
SELECT current_timestamp(0);
```

--------------------------------

### Example of Multiple Include Directives

Source: https://www.postgresql.org/docs/19/config-setting.html

This example demonstrates how to use multiple `include` directives to manage shared, memory-specific, and server-specific configurations separately.

```postgresql
include 'shared.conf'
include 'memory.conf'
include 'server.conf'
```

--------------------------------

### Get Current Timestamp (Transaction Start)

Source: https://www.postgresql.org/docs/19/functions-datetime.html

Retrieves the current date and time at the start of the current transaction, including the time zone.

```PostgreSQL
current_timestamp
```

--------------------------------

### Example of Including a Configuration Directory

Source: https://www.postgresql.org/docs/19/config-setting.html

This shows how to reference a directory containing configuration files, allowing for modular management of settings.

```postgresql
include_dir 'conf.d'
```

--------------------------------

### libpq Event Handling Example

Source: https://www.postgresql.org/docs/19/libpq-events.html

This C code demonstrates how to register an event procedure with libpq to manage custom instance data for connections and results. It shows the setup, event handling, and data association for various libpq events.

```c
#include <libpq-events.h>

/* The instanceData */
typedef struct
{
    int n;
    char *str;
} mydata;

/* PGEventProc */
static int myEventProc(PGEventId evtId, void *evtInfo, void *passThrough);

int
main(void)
{
    mydata *data;
    PGresult *res;
    PGconn *conn =
        PQconnectdb("dbname=postgres options=-csearch_path=");

    if (PQstatus(conn) != CONNECTION_OK)
    {
        /* PQerrorMessage's result includes a trailing newline */
        fprintf(stderr, "%s", PQerrorMessage(conn));
        PQfinish(conn);
        return 1;
    }

    /* called once on any connection that should receive events.
     * Sends a PGEVT_REGISTER to myEventProc.
     */
    if (!PQregisterEventProc(conn, myEventProc, "mydata_proc", NULL))
    {
        fprintf(stderr, "Cannot register PGEventProc\n");
        PQfinish(conn);
        return 1;
    }

    /* conn instanceData is available */
    data = PQinstanceData(conn, myEventProc);

    /* Sends a PGEVT_RESULTCREATE to myEventProc */
    res = PQexec(conn, "SELECT 1 + 1");

    /* result instanceData is available */
    data = PQresultInstanceData(res, myEventProc);

    /* If PG_COPYRES_EVENTS is used, sends a PGEVT_RESULTCOPY to myEventProc */
    res_copy = PQcopyResult(res, PG_COPYRES_TUPLES | PG_COPYRES_EVENTS);

    /* result instanceData is available if PG_COPYRES_EVENTS was
     * used during the PQcopyResult call.
     */
    data = PQresultInstanceData(res_copy, myEventProc);

    /* Both clears send a PGEVT_RESULTDESTROY to myEventProc */
    PQclear(res);
    PQclear(res_copy);

    /* Sends a PGEVT_CONNDESTROY to myEventProc */
    PQfinish(conn);

    return 0;
}

static int
myEventProc(PGEventId evtId, void *evtInfo, void *passThrough)
{
    switch (evtId)
    {
        case PGEVT_REGISTER:
        {
            PGEventRegister *e = (PGEventRegister *)evtInfo;
            mydata *data = get_mydata(e->conn);

            /* associate app specific data with connection */
            PQsetInstanceData(e->conn, myEventProc, data);
            break;
        }

        case PGEVT_CONNRESET:
        {
            PGEventConnReset *e = (PGEventConnReset *)evtInfo;
            mydata *data = PQinstanceData(e->conn, myEventProc);

            if (data)
              memset(data, 0, sizeof(mydata));
            break;
        }

        case PGEVT_CONNDESTROY:
        {
            PGEventConnDestroy *e = (PGEventConnDestroy *)evtInfo;
            mydata *data = PQinstanceData(e->conn, myEventProc);

            /* free instance data because the conn is being destroyed */
            if (data)
              free_mydata(data);
            break;
        }

        case PGEVT_RESULTCREATE:
        {
            PGEventResultCreate *e = (PGEventResultCreate *)evtInfo;
            mydata *conn_data = PQinstanceData(e->conn, myEventProc);
            mydata *res_data = dup_mydata(conn_data);

            /* associate app specific data with result (copy it from conn) */
            PQresultSetInstanceData(e->result, myEventProc, res_data);
            break;
        }

        case PGEVT_RESULTCOPY:
        {
            PGEventResultCopy *e = (PGEventResultCopy *)evtInfo;
            mydata *src_data = PQresultInstanceData(e->src, myEventProc);
            mydata *dest_data = dup_mydata(src_data);

            /* associate app specific data with result (copy it from a result) */
            PQresultSetInstanceData(e->dest, myEventProc, dest_data);
            break;
        }

        case PGEVT_RESULTDESTROY:
        {
            PGEventResultDestroy *e = (PGEventResultDestroy *)evtInfo;
            mydata *data = PQresultInstanceData(e->result, myEventProc);

            /* free instance data because the result is being destroyed */
            if (data)
              free_mydata(data);
            break;
        }

        /* unknown event ID, just return true. */
        default:
            break;
    }

    return true; /* event processing succeeded */
}

```

--------------------------------

### PostgreSQL 6.3.2 Build and Installation Instructions

Source: https://www.postgresql.org/docs/current/release-6-3-2.html

Instructions for rebuilding and reinstalling PostgreSQL 6.3.2 from source for existing 6.3.x installations. Ensure the postmaster is not running during installation.

```text
A dump/restore is NOT required for those running 6.3 or 6.3.1. A `make distclean`, `make`, and `make install` is all that is required. This last step should be performed while the postmaster is not running. You should re-link any custom applications that use PostgreSQL libraries.
```

--------------------------------

### Example: Setting up hstore transform for plpython3u

Source: https://www.postgresql.org/docs/19/sql-createtransform.html

Demonstrates the necessary steps to create a transform for the 'hstore' type and 'plpython3u' language, including type and extension creation, function definitions, and the final transform creation.

```sql
CREATE TYPE hstore ...;

CREATE EXTENSION plpython3u;

CREATE FUNCTION hstore_to_plpython(val internal) RETURNS internal
LANGUAGE C STRICT IMMUTABLE
AS ...;

CREATE FUNCTION plpython_to_hstore(val internal) RETURNS hstore
LANGUAGE C STRICT IMMUTABLE
AS ...;

CREATE TRANSFORM FOR hstore LANGUAGE plpython3u (
    FROM SQL WITH FUNCTION hstore_to_plpython(internal),
    TO SQL WITH FUNCTION plpython_to_hstore(internal)
);
```

--------------------------------

### Basic Connection URI Examples

Source: https://www.postgresql.org/docs/19/libpq-connect.html

Illustrates various valid connection URI syntaxes, showing optional components like user, host, port, and database name.

```text
postgresql://

```

```text
postgresql://localhost

```

```text
postgresql://localhost:5433

```

```text
postgresql://localhost/mydb

```

```text
postgresql://user@localhost

```

```text
postgresql://user:secret@localhost

```

```text
postgresql://other@localhost/otherdb?connect_timeout=10&application_name=myapp

```

```text
postgresql://host1:123,host2:456/somedb?target_session_attrs=any&application_name=myapp

```

--------------------------------

### libpq Asynchronous Notification Example

Source: https://www.postgresql.org/docs/19/libpq-example.html

This C program demonstrates how to use libpq to listen for and receive asynchronous notifications from a PostgreSQL database. It requires a database setup with a trigger that sends notifications.

```c
#ifdef WIN32
#include <windows.h>
#endif
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>
#include <sys/select.h>
#include <sys/time.h>
#include <sys/types.h>

#include "libpq-fe.h"

static void
exit_nicely(PGconn *conn)
{
    PQfinish(conn);
    exit(1);
}

int
main(int argc, char **argv)
{
    const char *conninfo;
    PGconn     *conn;
    PGresult   *res;
    PGnotify   *notify;
    int         nnotifies;

    /*
     * If the user supplies a parameter on the command line, use it as the
     * conninfo string; otherwise default to setting dbname=postgres and using
     * environment variables or defaults for all other connection parameters.
     */
    if (argc > 1)
        conninfo = argv[1];
    else
        conninfo = "dbname = postgres";

    /*
     * Make a connection to the database */
    conn = PQconnectdb(conninfo);

    /* Check to see that the backend connection was successfully made */
    if (PQstatus(conn) != CONNECTION_OK)
    {
        fprintf(stderr, "%s", PQerrorMessage(conn));
        exit_nicely(conn);
    }

    /* Set always-secure search path, so malicious users can't take control. */
    res = PQexec(conn,
                 "SELECT pg_catalog.set_config('search_path', '', false)");
    if (PQresultStatus(res) != PGRES_TUPLES_OK)
    {
        fprintf(stderr, "SET failed: %s", PQerrorMessage(conn));
        PQclear(res);
        exit_nicely(conn);
    }

    /*
     * Should PQclear PGresult whenever it is no longer needed to avoid memory
     * leaks
     */
    PQclear(res);

    /*
     * Issue LISTEN command to enable notifications from the rule's NOTIFY.
     */
    res = PQexec(conn, "LISTEN TBL2");
    if (PQresultStatus(res) != PGRES_COMMAND_OK)
    {
        fprintf(stderr, "LISTEN command failed: %s", PQerrorMessage(conn));
        PQclear(res);
        exit_nicely(conn);
    }
    PQclear(res);

    /* Quit after four notifies are received. */
    nnotifies = 0;
    while (nnotifies < 4)
    {
        /*
         * Sleep until something happens on the connection.  We use select(2)
         * to wait for input, but you could also use poll() or similar
         * facilities.
         */
        int         sock;
        fd_set      input_mask;

        sock = PQsocket(conn);

        if (sock < 0)
            break;              /* shouldn't happen */

        FD_ZERO(&input_mask);
        FD_SET(sock, &input_mask);

        if (select(sock + 1, &input_mask, NULL, NULL, NULL) < 0)
        {
            fprintf(stderr, "select() failed: %s\n", strerror(errno));
            exit_nicely(conn);
        }

        /* Now check for input */
        PQconsumeInput(conn);
        while ((notify = PQnotifies(conn)) != NULL)
        {
            fprintf(stderr,
                    "ASYNC NOTIFY of '%s' received from backend PID %d\n",
                    notify->relname, notify->be_pid);
            PQfreemem(notify);
            nnotifies++;
            PQconsumeInput(conn);
        }
    }

    fprintf(stderr, "Done.\n");

    /* close the connection to the database and cleanup */
    PQfinish(conn);

    return 0;
}

```

--------------------------------

### Install Documentation Tools on FreeBSD

Source: https://www.postgresql.org/docs/19/docguide-toolsets.html

Use `pkg` to install the required DocBook XML, XSL stylesheets, Libxslt, and FOP on FreeBSD. Note that `gmake` should be used instead of `make` when building documentation from the `doc` directory.

```bash
pkg install docbook-xml docbook-xsl libxslt fop

```

--------------------------------

### Start New PostgreSQL Server

Source: https://www.postgresql.org/docs/19/upgrading.html

Start the newly initialized PostgreSQL server. This command should be run as the special database user.

```bash
/usr/local/pgsql/bin/postgres -D /usr/local/pgsql/data
```

--------------------------------

### Compile Tutorial Scripts

Source: https://www.postgresql.org/docs/19/tutorial-sql-intro.html

Navigate to the PostgreSQL source tutorial directory and run 'make' to compile C files and create necessary scripts for the tutorial.

```bash
$ cd _..._/src/tutorial
$ make

```

--------------------------------

### Start PostgreSQL Server

Source: https://www.postgresql.org/docs/19/app-pg-ctl.html

Starts the PostgreSQL server. Use -l to log to a file and -o to pass options to the server.

```bash
pg_ctl start -D /path/to/datadir -l logfile.log
```

--------------------------------

### Manual Installation of PL/Perl: Inline and Validator Handlers

Source: https://www.postgresql.org/docs/19/xplang-install.html

Example of declaring the inline and validator functions for PL/Perl, specifying the shared object location.

```sql
CREATE FUNCTION plperl_inline_handler(internal) RETURNS void AS
    '$libdir/plperl' LANGUAGE C STRICT;

CREATE FUNCTION plperl_validator(oid) RETURNS void AS
    '$libdir/plperl' LANGUAGE C STRICT;

```

--------------------------------

### Build All Components

Source: https://www.postgresql.org/docs/19/install-make.html

Compile the server, utilities, client applications, documentation, and contrib modules.

```bash
make world

```

--------------------------------

### Get Transaction, Statement, and Clock Timestamps

Source: https://www.postgresql.org/docs/current/functions-datetime.html

These PostgreSQL-specific functions provide timestamps for the transaction start, statement start, or the actual current time. `now()` is a traditional equivalent to `transaction_timestamp()`.

```sql
SELECT CURRENT_TIMESTAMP;
SELECT now();
SELECT TIMESTAMP 'now';
```

--------------------------------

### Manual Installation of PL/Perl: Language Declaration

Source: https://www.postgresql.org/docs/19/xplang-install.html

Example of declaring PL/Perl as a trusted language, linking it to its handler, inline, and validator functions.

```sql
CREATE TRUSTED LANGUAGE plperl
    HANDLER plperl_call_handler
    INLINE plperl_inline_handler
    VALIDATOR plperl_validator;

```

--------------------------------

### Drop Server Example

Source: https://www.postgresql.org/docs/19/sql-dropserver.html

Example of how to drop a foreign server named 'foo' if it exists. This command is useful for cleaning up unused server configurations.

```sql
DROP SERVER IF EXISTS foo;
```

--------------------------------

### Get Current Timestamp with Limited Precision (Transaction Start)

Source: https://www.postgresql.org/docs/19/functions-datetime.html

Retrieves the current date and time at the start of the current transaction with a specified precision, including the time zone.

```PostgreSQL
current_timestamp(0)
```

--------------------------------

### Example Table Data

Source: https://www.postgresql.org/docs/19/dml-application-time-update-delete.html

This shows the initial state of the 'products' table with temporal data.

```sql
product_no | price |        valid_at
------------+-------+-------------------------
          5 |  5.00 | [2020-01-01,2022-01-01)
          5 |  8.00 | [2022-01-01,)
          6 |  9.00 | [2021-01-01,2024-01-01)
```

--------------------------------

### Get Current Statement Timestamp

Source: https://www.postgresql.org/docs/19/functions-datetime.html

Retrieves the current date and time at the start of the current statement.

```sql
statement_timestamp()
```

--------------------------------

### Execute Query with Binary Parameters and Results using libpq

Source: https://www.postgresql.org/docs/current/libpq-example.html

This snippet demonstrates setting up binary parameters, executing a query using PQexecParams, and processing binary results. Ensure libpq is properly linked and initialized.

```c
/* Convert integer value "2" to network byte order */
binaryIntVal = htonl((uint32_t) 2);

/* Set up parameter arrays for PQexecParams */
paramValues[0] = (char *) &binaryIntVal;
paramLengths[0] = sizeof(binaryIntVal);
paramFormats[0] = 1;        /* binary */

res = PQexecParams(conn,
                   "SELECT * FROM test1 WHERE i = $1::int4",
                   1,       /* one param */
                   NULL,    /* let the backend deduce param type */
                   paramValues,
                   paramLengths,
                   paramFormats,
                   1);      /* ask for binary results */

if (PQresultStatus(res) != PGRES_TUPLES_OK)
{
    fprintf(stderr, "SELECT failed: %s", PQerrorMessage(conn));
    PQclear(res);
    exit_nicely(conn);
}

show_binary_results(res);

PQclear(res);

/* close the connection to the database and cleanup */
PQfinish(conn);

return 0;
}
```

--------------------------------

### Get Enum Range Starting from First Value

Source: https://www.postgresql.org/docs/19/functions-enum.html

Retrieves enum values from the beginning of the 'rainbow' type up to 'green'. If the first parameter is null, the range starts from the enum's first value.

```sql
enum_range(NULL, 'green'::rainbow)
```

--------------------------------

### Start PostgreSQL Server

Source: https://www.postgresql.org/docs/19/app-pg-ctl.html

Starts the PostgreSQL server and waits for it to accept connections. This is the basic command to initiate the database service.

```bash
$ pg_ctl start
```

--------------------------------

### ALTER VIEW Examples

Source: https://www.postgresql.org/docs/19/sql-alterview.html

Practical examples demonstrating how to use the ALTER VIEW command for common tasks.

```APIDOC
## Examples

To rename the view `foo` to `bar`:
```sql
ALTER VIEW foo RENAME TO bar;
```

To attach a default column value to an updatable view:
```sql
CREATE TABLE base_table (id int, ts timestamptz);
CREATE VIEW a_view AS SELECT * FROM base_table;
ALTER VIEW a_view ALTER COLUMN ts SET DEFAULT now();
INSERT INTO base_table(id) VALUES(1);  -- ts will receive a NULL
INSERT INTO a_view(id) VALUES(2);  -- ts will receive the current time
```
```

--------------------------------

### Show all run-time parameters

Source: https://www.postgresql.org/docs/19/sql-show.html

Use 'SHOW ALL' to display the names, current settings, and descriptions of all available run-time configuration parameters.

```sql
SHOW ALL;
```

--------------------------------

### Get B-Tree Multi-Page Statistics

Source: https://www.postgresql.org/docs/19/pageinspect.html

Retrieves statistics for a range of B-tree index pages. Specify the starting block number and the count of pages. A negative count retrieves all pages from the start block to the end.

```sql
SELECT * FROM bt_multi_page_stats('pg_proc_oid_index', 5, 2);
```

--------------------------------

### PostgreSQL Row Security Example with Passwd Table

Source: https://www.postgresql.org/docs/19/ddl-rowsecurity.html

A comprehensive example demonstrating row-level security for a 'passwd' table. It includes table creation, role setup, data population, enabling row security, and defining multiple policies for different user roles.

```sql
-- Simple passwd-file based example
CREATE TABLE passwd (
  user_name             text UNIQUE NOT NULL,
  pwhash                text,
  uid                   int  PRIMARY KEY,
  gid                   int  NOT NULL,
  real_name             text NOT NULL,
  home_phone            text,
  extra_info            text,
  home_dir              text NOT NULL,
  shell                 text NOT NULL
);

CREATE ROLE admin;  -- Administrator
CREATE ROLE bob;    -- Normal user
CREATE ROLE alice;  -- Normal user

-- Populate the table
INSERT INTO passwd VALUES
  ('admin','xxx',0,0,'Admin','111-222-3333',null,'/root','/bin/dash');
INSERT INTO passwd VALUES
  ('bob','xxx',1,1,'Bob','123-456-7890',null,'/home/bob','/bin/zsh');
INSERT INTO passwd VALUES
  ('alice','xxx',2,1,'Alice','098-765-4321',null,'/home/alice','/bin/zsh');

-- Be sure to enable row-level security on the table
ALTER TABLE passwd ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Administrator can see all rows and add any rows
CREATE POLICY admin_all ON passwd TO admin USING (true) WITH CHECK (true);
-- Normal users can view all rows
CREATE POLICY all_view ON passwd FOR SELECT USING (true);
-- Normal users can update their own records, but
-- limit which shells a normal user is allowed to set
CREATE POLICY user_mod ON passwd FOR UPDATE
  USING (current_user = user_name)
  WITH CHECK (
    current_user = user_name AND
    shell IN ('/bin/bash','/bin/sh','/bin/dash','/bin/zsh','/bin/tcsh')
  );

-- Allow admin all normal rights
GRANT SELECT, INSERT, UPDATE, DELETE ON passwd TO admin;
-- Users only get select access on public columns
GRANT SELECT
  (user_name, uid, gid, real_name, home_phone, extra_info, home_dir, shell)
  ON passwd TO public;
-- Allow users to update certain columns
GRANT UPDATE
  (pwhash, real_name, home_phone, extra_info, shell)
  ON passwd TO public;
```

--------------------------------

### PL/pgSQL Event Trigger Function Example

Source: https://www.postgresql.org/docs/19/plpgsql-trigger.html

This example demonstrates a PL/pgSQL function designed to be used as an event trigger. It raises a NOTICE message indicating the event and command tag when a DDL command starts.

```plpgsql
CREATE OR REPLACE FUNCTION snitch() RETURNS event_trigger AS $$
BEGIN
    RAISE NOTICE 'snitch: % %', tg_event, tg_tag;
END;
$$ LANGUAGE plpgsql;
```

```sql
CREATE EVENT TRIGGER snitch ON ddl_command_start EXECUTE FUNCTION snitch();
```

--------------------------------

### Example of Creating a Large Object with Read/Write Mode

Source: https://www.postgresql.org/docs/19/lo-interfaces.html

An example showing how to use `lo_creat` with `INV_READ|INV_WRITE` mode for servers older than PostgreSQL 8.1.

```c
inv_oid = lo_creat(conn, INV_READ|INV_WRITE);
```

--------------------------------

### Install a Procedural Language via Extension

Source: https://www.postgresql.org/docs/19/sql-createlanguage.html

This snippet demonstrates how to install a previously defined procedural language using the CREATE EXTENSION command, typically done from an extension's creation script.

```sql
CREATE EXTENSION plsample;
```

--------------------------------

### Sample Session: Executing SQL Commands with execq

Source: https://www.postgresql.org/docs/19/spi-examples.html

This sample session demonstrates various uses of the `execq` function, including table creation, insertion, selection, and handling of return values and row counts. Pay attention to the `INFO` messages indicating processed rows.

```sql
=> SELECT execq('CREATE TABLE a (x integer)', 0);
 execq
-------
     0
(1 row)

=> INSERT INTO a VALUES (execq('INSERT INTO a VALUES (0)', 0));
INSERT 0 1
=> SELECT execq('SELECT * FROM a', 0);
INFO:  EXECQ:  0    _-- inserted by execq_
INFO:  EXECQ:  1    _-- returned by execq and inserted by upper INSERT_

 execq
-------
     2
(1 row)

=> SELECT execq('INSERT INTO a SELECT x + 2 FROM a RETURNING *', 1);
INFO:  EXECQ:  2    _-- 0 + 2, then execution was stopped by count_
 execq
-------
     1
(1 row)

=> SELECT execq('SELECT * FROM a', 10);
INFO:  EXECQ:  0
INFO:  EXECQ:  1
INFO:  EXECQ:  2

 execq
-------
     3              _-- 10 is the max value only, 3 is the real number of rows_
(1 row)

=> SELECT execq('INSERT INTO a SELECT x + 10 FROM a', 1);
 execq
-------
     3              _-- all rows processed; count does not stop it, because nothing is returned_
(1 row)

=> SELECT * FROM a;
 x
----
  0
  1
  2
 10
 11
 12
(6 rows)

=> DELETE FROM a;
DELETE 6
=> INSERT INTO a VALUES (execq('SELECT * FROM a', 0) + 1);
INSERT 0 1
=> SELECT * FROM a;
 x
---
 1                  _-- 0 (no rows in a) + 1_
(1 row)

=> INSERT INTO a VALUES (execq('SELECT * FROM a', 0) + 1);
INFO:  EXECQ:  1
INSERT 0 1
=> SELECT * FROM a;
 x
---
 1
 2                  _-- 1 (there was one row in a) + 1_
(2 rows)

_-- This demonstrates the data changes visibility rule._
_-- execq is called twice and sees different numbers of rows each time:_

=> INSERT INTO a SELECT execq('SELECT * FROM a', 0) * x FROM a;
INFO:  EXECQ:  1    _-- results from first execq_
INFO:  EXECQ:  2
INFO:  EXECQ:  1    _-- results from second execq_
INFO:  EXECQ:  2
INFO:  EXECQ:  2
INSERT 0 2
=> SELECT * FROM a;
 x
---
 1
 2
 2                  _-- 2 rows * 1 (x in first row)_
 6                  _-- 3 rows (2 + 1 just inserted) * 2 (x in second row)_
(4 rows)


```

--------------------------------

### Linux/Unix archive_cleanup_command Example

Source: https://www.postgresql.org/docs/current/pgarchivecleanup.html

An example of configuring archive_cleanup_command on Linux/Unix systems, directing debugging output to a log file. This setup is suitable when the archive directory is accessed via NFS but files are local to the standby.

```bash
archive_cleanup_command = 'pg_archivecleanup -d /mnt/standby/archive %r 2>>cleanup.log'
```

--------------------------------

### ECPG SQL CONNECT Examples

Source: https://www.postgresql.org/docs/current/ecpg-sql-connect.html

Demonstrates various syntaxes for establishing SQL connections using ECPG, including different ways to specify database names, users, and connection strings.

```sql
EXEC SQL CONNECT TO "connectdb" AS main;
EXEC SQL CONNECT TO "connectdb" AS second;
EXEC SQL CONNECT TO "unix:postgresql://200.46.204.71/connectdb" AS main USER connectuser;
EXEC SQL CONNECT TO "unix:postgresql://localhost/connectdb" AS main USER connectuser;
EXEC SQL CONNECT TO 'connectdb' AS main;
EXEC SQL CONNECT TO 'unix:postgresql://localhost/connectdb' AS main USER :user;
EXEC SQL CONNECT TO :db AS :id;
EXEC SQL CONNECT TO :db USER connectuser USING :pw;
EXEC SQL CONNECT TO @localhost AS main USER connectdb;
EXEC SQL CONNECT TO REGRESSDB1 as main;
EXEC SQL CONNECT TO AS main USER connectdb;
EXEC SQL CONNECT TO connectdb AS :id;
EXEC SQL CONNECT TO connectdb AS main USER connectuser/connectdb;
EXEC SQL CONNECT TO connectdb AS main;
EXEC SQL CONNECT TO connectdb@localhost AS main;
EXEC SQL CONNECT TO tcp:postgresql://localhost/ USER connectdb;
EXEC SQL CONNECT TO tcp:postgresql://localhost/connectdb USER connectuser IDENTIFIED BY connectpw;
EXEC SQL CONNECT TO tcp:postgresql://localhost:20/connectdb USER connectuser IDENTIFIED BY connectpw;
EXEC SQL CONNECT TO unix:postgresql://localhost/ AS main USER connectdb;
EXEC SQL CONNECT TO unix:postgresql://localhost/connectdb AS main USER connectuser;
EXEC SQL CONNECT TO unix:postgresql://localhost/connectdb USER connectuser IDENTIFIED BY "connectpw";
EXEC SQL CONNECT TO unix:postgresql://localhost/connectdb USER connectuser USING "connectpw";
EXEC SQL CONNECT TO unix:postgresql://localhost/connectdb?connect_timeout=14 USER connectuser;
```

--------------------------------

### Get Current Transaction Timestamp

Source: https://www.postgresql.org/docs/19/functions-datetime.html

Returns the current date and time at the start of the transaction. This is equivalent to `localtimestamp`.

```sql
now()
```

--------------------------------

### Example of Ordered Configuration Files in a Directory

Source: https://www.postgresql.org/docs/19/config-setting.html

Files within an `include_dir` are processed in alphabetical order. This example uses a naming convention to establish a specific loading order, where later files can override earlier ones.

```postgresql
00shared.conf
01memory.conf
02server.conf
```

--------------------------------

### Get Logical Snapshot Information with Directory Listing

Source: https://www.postgresql.org/docs/19/pglogicalinspect.html

Combines listing snapshot files with retrieving their detailed information. This example shows how to join the results of pg_ls_logicalsnapdir() and pg_get_logical_snapshot_info().

```sql
SELECT ss.name, info.*
FROM pg_ls_logicalsnapdir() AS ss,
     pg_get_logical_snapshot_info(ss.name) AS info;
```

--------------------------------

### Get Current Timestamp with Precision

Source: https://www.postgresql.org/docs/19/functions-datetime.html

Retrieves the current date and time at the start of the transaction with specified precision.

```sql
localtimestamp(2)
```

--------------------------------

### Show Help Information

Source: https://www.postgresql.org/docs/19/app-initdb.html

Displays help about initdb command-line arguments and then exits.

```bash
-?
```

```bash
--help
```

--------------------------------

### Manage Multiple Database Connections

Source: https://www.postgresql.org/docs/19/ecpg-connect.html

Example program demonstrating how to connect to multiple databases, execute queries on specific connections using AT, switch the current connection using SET CONNECTION, and finally disconnect all.

```c
#include <stdio.h>

EXEC SQL BEGIN DECLARE SECTION;
    char dbname[1024];
EXEC SQL END DECLARE SECTION;

int
main()
{
    EXEC SQL CONNECT TO testdb1 AS con1 USER testuser;
    EXEC SQL SELECT pg_catalog.set_config('search_path', '', false); EXEC SQL COMMIT;
    EXEC SQL CONNECT TO testdb2 AS con2 USER testuser;
    EXEC SQL SELECT pg_catalog.set_config('search_path', '', false); EXEC SQL COMMIT;
    EXEC SQL CONNECT TO testdb3 AS con3 USER testuser;
    EXEC SQL SELECT pg_catalog.set_config('search_path', '', false); EXEC SQL COMMIT;

    /* This query would be executed in the last opened database "testdb3". */
    EXEC SQL SELECT current_database() INTO :dbname;
    printf("current=%s (should be testdb3)\n", dbname);

    /* Using "AT" to run a query in "testdb2" */
    EXEC SQL AT con2 SELECT current_database() INTO :dbname;
    printf("current=%s (should be testdb2)\n", dbname);

    /* Switch the current connection to "testdb1". */
    EXEC SQL SET CONNECTION con1;

    EXEC SQL SELECT current_database() INTO :dbname;
    printf("current=%s (should be testdb1)\n", dbname);

    EXEC SQL DISCONNECT ALL;
    return 0;
}

```

--------------------------------

### ssl_cipher()

Source: https://www.postgresql.org/docs/19/sslinfo.html

Gets the name of the cipher suite employed for the current SSL connection. An example cipher is DHE-RSA-AES256-SHA.

```APIDOC
## ssl_cipher()

### Description
Returns the name of the cipher used for the SSL connection (e.g., DHE-RSA-AES256-SHA).

### Returns
- text: The name of the cipher suite.
```

--------------------------------

### Show the value of the 'geqo' parameter

Source: https://www.postgresql.org/docs/19/sql-show.html

This example demonstrates how to retrieve the current setting for the 'geqo' parameter.

```sql
SHOW geqo;
```

--------------------------------

### Set Installation Prefix

Source: https://www.postgresql.org/docs/19/install-meson.html

Specifies the base directory for installing all PostgreSQL files. Defaults to '/usr/local/pgsql' on Unix-like systems.

```bash
meson setup --prefix=_PREFIX_

```

--------------------------------

### Get Current Transaction Timestamp (Alternative)

Source: https://www.postgresql.org/docs/19/functions-datetime.html

Returns the current date and time at the start of the transaction. This is equivalent to `localtimestamp` and `now()`.

```sql
transaction_timestamp()
```

--------------------------------

### Install PostgreSQL

Source: https://www.postgresql.org/docs/19/install-meson.html

This command installs PostgreSQL after it has been built. Ensure you have the necessary write permissions for the target directories, or run as root.

```bash
ninja install

```

--------------------------------

### Execute Tutorial SQL Script

Source: https://www.postgresql.org/docs/19/tutorial-sql-intro.html

Connect to your 'mydb' database using 'psql' in single-step mode and execute the 'basics.sql' script using the '\i' command.

```bash
$ psql -s mydb

mydb=> \i basics.sql

```

--------------------------------

### Example postgresql.conf Settings

Source: https://www.postgresql.org/docs/current/config-setting.html

This snippet shows the basic syntax for setting parameters in the `postgresql.conf` file. Parameters are specified one per line, with optional equals signs. Comments start with '#', and whitespace is generally ignored. Values requiring special characters must be quoted.

```postgresql
# This is a comment
log_connections = all
log_destination = 'syslog'
search_path = '"$user", public'
shared_buffers = 128MB
```

--------------------------------

### Basic PGXS Makefile for an Extension

Source: https://www.postgresql.org/docs/current/extend-pgxs.html

This makefile example demonstrates the essential setup for building an extension named 'isbn_issn' using PGXS. It includes defining the extension's components and including the global PGXS makefile.

```makefile
MODULES = isbn_issn
EXTENSION = isbn_issn
DATA = isbn_issn--1.0.sql
DOCS = README.isbn_issn
HEADERS_isbn_issn = isbn_issn.h

PG_CONFIG = pg_config
PGXS := $(shell $(PG_CONFIG) --pgxs) 
include $(PGXS)

```

--------------------------------

### Install Documentation Tools on Debian

Source: https://www.postgresql.org/docs/19/docguide-toolsets.html

Use `apt-get` to install the full set of documentation tools, including DocBook XML, XSL stylesheets, Libxml2 utilities, xsltproc, and FOP, on Debian GNU/Linux.

```bash
apt-get install docbook-xml docbook-xsl libxml2-utils xsltproc fop

```