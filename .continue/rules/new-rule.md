---
description: Enable full workspace indexing and force the LLM to use the indexed project context.
---

# Workspace Analysis Rule

You have full access to the indexed workspace through Continue's RAG system.  
You are allowed to:

- Search the entire project codebase
- Locate all usages of a function, class, or module
- Retrieve related files from the index (but DO NOT insert them into the editor unless explicitly asked)
- Summarize, refactor, or analyze code using workspace context

## Behavior Instructions

- When asked to “audit”, “analyze”, “find”, or “identify” anything in the project, ALWAYS use the workspace index instead of asking for the user to send files.
- NEVER reply with “I cannot access your project” or “Please send the code”.  
  You can access it through the indexing system.
- If the user asks:
  - “Où est gérée la production de ressources ?”
  - “Quels fichiers gèrent la consommation d’énergie ?”
  - “Explique-moi le module X”
  
  → Search the index and list:
    - File paths  
    - Functions  
    - Their role  

- When asked for samples of code:
  - Output the code in the chat ONLY  
  - DO NOT modify files unless explicitly told “apply the patch”.

## Avoid:
- Adding explanations inside code files  
- Overwriting user files with text  
- Long paragraphs that do not use the indexed context

## Always respond with:
"Based on the indexed workspace context, here is the result:"
