# Internship - Backend Development Intern

This repository contains a Node.js backend application for analyzing websites and performing CRUD operations, built as part of the Backend Development Intern internship task.

## Requirements

### 1. Tech Stack
- **Backend**: Node.js (Express.js)
- **Database**: Supabase (PostgreSQL free tier)
- **Web Scraping Library**: Cheerio
- **AI Integration** (Optional but encouraged): Placeholder for OpenAI API (future enhancement)
- **Version Control**: GitHub (public repo)
- **API Testing**: Postman

### 2. Core Features
#### A. Website Analysis API
- Accept a website URL as input via a POST request.
- Scrape and extract:
  - Brand name (from metadata or site content).
  - Website description (meta description or generated from page content).
- (Optional) Enhance the extracted description using AI for better readability.
- Store extracted/enhanced details in the database with a timestamp.

#### B. CRUD Operations
- Retrieve all stored website records.
- Update or delete an existing record.

#### C. Error Handling & Validation
- Validate the URL format before scraping.
- Handle timeouts, inaccessible sites, and missing metadata gracefully.

### 3. Deliverables
- **GitHub Repository**:
  - Well-structured, clean code.
- **README.md**:
  - Setup steps, environment variables, and usage instructions (this file).
- **Postman Collection**:
  - Collection for all endpoints (link below).
- **Deployed API**:
  - Hosted on a free hosting platform (Vercel, link below).

### 4. Bonus (Optional)
- AI-powered description generation for richer summaries (placeholder implemented).
- Rate limiting to prevent abuse (future enhancement).
- Swagger/OpenAPI documentation (future enhancement).

## Setup

### Prerequisites
- Node.js (v14 or later)
- npm (Node Package Manager)
- Git
- Supabase account with PostgreSQL database

### Installation
1. Clone the repository
2. Install dependencies
3. Set up environment variables

### Database Setup
1. Install Prisma CLI
2. Push the schema to Supabase

(Ensure `schema.prisma` defines the `website` model with fields: `id`, `url`, `brandName`, `description`, `enhancedDescription`, `createdAt`, `updatedAt`.)

## Usage

### Running Locally
1. Start the server

2. Test endpoints using Postman:
- **POST /analyze**: `{"url": "https://rgukt.in/"}`
- **GET /websites**: Retrieve all records.
- **PUT /websites/:id**: Update a record (e.g., `{"description": "Updated desc"}`).
- **DELETE /websites/:id**: Delete a record.








