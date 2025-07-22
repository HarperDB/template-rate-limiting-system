# template-rate-limiting-system

# Alias: VOD Segment Access Control System

## Overview

This project implements a system to prevent bot users and potential pirates from accessing resources like VOD segments from a service.
It utilizes Harper as a database solution in conjunction with Edge workers to store data and logic for quickly retrieving records,
accepting or denying VOD segment requests, and detecting potential piracy activities.

## Functional Requirements

The current implementation includes:

- Storing and processing subscriber's information for each request.
- Real-time piracy detection based on subscriber activity.

## Data Model

The `subscriber_log` table schema includes:
- SubscriberID - Primary key for entry (stored as [subscriberId, time])
- ClientSessionID - Client id from token
- ContentName - Content Name
- ClientIP - Client ip of the requests
- EdgeIP - Edge ip of the requests
- Time - Time of the request
- User-Agent - User Agent of the request
- Host - Host component of the URL
- Path - Request Path component of URL
- ClientLocation - Location of client playing the content

## API Endpoints

### Data Ingest
- `POST /subscriberlog`: Adds a new subscriber event log entry and performs piracy checks
    - Body: `{ subscriberId, clientsessionId, Contentname, edgeIP, clientIP, useragent, Host, Path, clientLocation }`
    - Note: `subscriberId` is required
    - Returns: 200 OK with custom headers indicating piracy status

## Technical Implementation

- The system uses Harper's Resource API to implement the required logic.
- The `subscriberlog` class manages the insertion of new log entries and performs real-time piracy detection.
- Piracy detection is performed using an optimized method that checks multiple conditions within a 10-second window.
- The primary key for log entries is a compound key of [subscriberId, time] for efficient time-based searches.
- Indexed fields (sessionId, clientIP, time) are used to optimize query performance.

### Piracy Detection

The system checks for the following conditions within a 10-second window:

- Condition 1: Number of requests for unique combination of subscriberID and Contentname > 50
- Condition 2: Number of unique client IPs for unique combination of subscriberID and ContentName > 4
- Condition 3: Number of unique ContentNames for unique combination of subscriberID > 4
- Condition 4: Number of unique SessionIDs for unique combination of subscriberID and clientIP > 1

## Deployment

### PoC Environment Example
- 2 GEO: London, Paris
- 2 x 32GB Harper Nodes
- Akamai: Ion Cache, EdgeWorkers, Global Traffic Manager

### Production Environment
- TBD

## Usage Examples

### Logging a subscriber event and checking for piracy:

POST /subscriberlog
Body:
{
"subscriberId": "sub1234",
"clientsessionId": "sess1234",
"Contentname": "abdc",
"edgeIP": "1.2.3.4",
"clientIP": "1.2.3.4",
"useragent": "abcd",
"Host": "abdc",
"Path": "abdc",
"clientLocation": "abdc"
}

Response Headers:
X-subscriber-pirate: True/False
X-subscriber-condition: If pirate this will return comma-separated list of met conditions:
high_requests,high_ip_count,multiple_content_views,multiple_sessions
X-subscriber-blacklist: True/False

## Data Maintenance
- Records are deleted manually for now. Future phases may implement automatic data retention policies.

For more detailed information on setup, API usage, and troubleshooting, please
refer to the additional documentation in the docs/ directory.
