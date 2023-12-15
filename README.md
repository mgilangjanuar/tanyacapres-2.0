# TanyaCapres 2.0

This is a new version of TanyaCapres, an AI-powered assistant for answering questions about Indonesian presidential candidates.

### Getting Started

0. Install [NodeJS](https://nodejs.org/en/download/), [Python 3.11](https://www.python.org/downloads/release/python-3110/), and [Bun](https://bun.sh/) on your machine.

1. Clone this repository.

2. Install dependencies.

    - for ai:

      ```bash
      cd ai && pip install -r requirements.txt
      ```

    - for api:

      ```bash
      cd api && bun install
      ```

    - for web:

      ```bash
      cd web && bun install
      ```

3. Define environment variables.

    ```bash
    cp api/.env.example api/.env
    ```

    | Variable | Description |
    | --- | --- |
    | PORT | Port for running the server |
    | AI_URL | URL for AI server (default: http://127.0.0.1:5001) |
    | ANTHROPIC_API_KEY | Anthropic API key |


    ```bash
    cp web/.env.example web/.env.local
    ```

    | Variable | Description |
    | --- | --- |
    | VITE_API_URL | API URL (default: http://localhost:4001/v1) |
    | ANTHROPIC_API_KEY | Anthropic API key |

4. Run in development mode.

    - for ai:

      ```bash
      cd ai && python main.py
      ```

    - for api:

      ```bash
      cd api && bun --watch index.ts
      ```

    - for web:

      ```bash
      cd web && bun run dev
      ```

5. Open http://localhost:5173 in your browser.
