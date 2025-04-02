# Unit AI-2: Movie Recommendation RAG App

## Summary

You will be building a RAG-powered movie recommendation app. 🎥

## Learning objectives

- Develop proficiency with RAG and vector databases.
- Cultivate instincts and strategies for evaluating retrieval, augmentation, and generation – as units and as an integrated whole.
- Build a functional prototype of a full-stack RAG application.

## Getting started

- Fork and clone this repo
- Add an `upstream` link to the CodesmithLLC repo
- Add a `partner` link to your partner's repo
- Use `git push origin main` and `git pull partner main` to stay in sync

## Challenges

### Data processing

- Download the compressed, preprocessed dataset [here](https://drive.google.com/file/d/1u_4BkOEncctgGij0FpPJfz7Fds4CVxiO/view?usp=sharing). Decompress it 💆 and store `embeddings_data.json` in the `offline` dir in this repo.
- Sign up for the “Starter” free tier on [Pinecone](https://www.pinecone.io/), store your API key in a `.env` file, and then create a “movies” index through the Pinecone browser console using the recommended metric + dimensions for `text-embedding-3-small` (leave other options unchanged to remain within the free tier).
- Run the batch processing pipeline with `npm run upsert-batch` to upsert the embeddings into your Pinecone index. If you run into Pinecone network errors, there's a line you can uncomment in `offline/upsert-batch.ts`. Take a look in the Pinecone browser console to confirm that everything worked!

### Initial app setup

- Create an OpenAI api key for this project and add it to your `.env` file.
- As with Unit-AI-1, I **highly recommend TDD** ✅
- Integrate `text-embedding-3-small` for embeddings and a GPT model for chat completions.
- Integrate your vector DB.
- Implement the `post('/api')` route using your middleware functions.

### Evaluation

The fundamental challenge here, as in Unit AI-1, is: How can you be confident that your LLM interactions work as expected? But there are now several dimensions to consider:

- How should you test whether you’re retrieving the “right” results through semantic search?
  - Are your results accurate?
  - Are they precise?
  - Are they ranked correctly?
  - What other considerations are relevant for this use case? If you (as a proxy for your users) are not interested in watching the movie(s) that are retrieved, how can you improve the results?
- How should you test the impact of the results on the LLM’s generated response?
  - Is its response faithful to the context provided? Is it recommending one of the retrieved results? Is it generating summaries based on the plots provided to it, or is it using its own “knowledge”? Are there metrics that could be helpful here?
  - Is its answer relevant to the user’s question?
- How should you balance feasibility and efficiency against efficacy in evaluation?

Remember to consider reliability (using an appropriate acceptance threshold) and any appropriate metrics or benchmarks!

### Iteration

Keeping track of your efforts is _even more important_ when there are several steps (each with their own input and output) along the way. How can you implement logging in a way that facilitates your development process?

### MVP goal: Search by summary

Your MVP goal is for the user to be able to get a movie recommendation (including a brief description) based on a summary they provide. How should you test this functionality given that movie recommendations are so subjective? Think about ways you can _strongly_ push the model in a particular direction:

- What if you search using a summary that’s included word-for-word in your embedded data?
- What about slightly rephrasing a summary?
- What about movie franchises or collections of movies that are highly related?

**Make sure you’re testing and optimizing the retrieval, augmentation, _and_ generation!** And don’t forget the importance of building a golden dataset to facilitate iteration and guard against regressions.

### Stretch goal 1: Filter by year

Your users would love to be able to specify a range of years to improve the recommendations they receive! And one of the best ways to optimize a RAG app is with metadata filtering.

- Add two additional front-end inputs for the user to specify a range of years to search between (`startYear` and `endYear`).
- Modify your back-end to incorporate this filter _if specified by the user_.
- Make sure to handle edge cases where no results are returned!

### Stretch goal 2: Search by title

Your users want to be able to search by summary _or_ by title! Of course, you want to make use of your company’s primary DB to retrieve summaries for the titles they input 👍

- Log into your [MongoDB account](https://account.mongodb.com/account/login), create a new project, create a new cluster in that project (**make sure to choose the M0 free tier!),** and preload the sample dataset (you can do this when creating the cluster or immediately after). You’ll be using the `movies` collection from the [sample_mflix dataset](https://www.mongodb.com/docs/atlas/sample-data/sample-mflix/).
- Add a toggle on the front end for the user to specify whether they’re searching by **summary** or by **title**.
- Integrate your Mongo DB on the back end so you can perform a semantic search in Pinecone based on the summary retrieved from Mongo.
- What should you do if the title isn’t found in the Mongo DB?

### Stretch goal 3: Natural language search

Your users _really_ want to get recommendations based _solely_ on a natural language query, with no toggles or separate filter inputs! If only there was a tool you could use to parse natural language 🤔

- Implement a query parser on the back end to determine whether the user is searching by title or summary and extract any valid filters.
- Restructure your back end as needed.
- Ditch the toggles and year inputs on the front end.

### Stretch goal 4: Additional filters and search by vibe

Good thing you’re collecting all this user feedback!

- Add support for filtering by genre and by director.
- Add a “search by vibe” capability. 💫 How can you still use semantic search here…can your GPT model provide an effective search query?

### Stretch goal 5: Fine-tuning

Your GPT model is doing a decent job of distinguishing search by summary vs title vs vibe, but it doesn't always get it right. Since it seems easier to "show, not tell" the differences, you've decided to try fine-tuning! take everything you learned (and logged!) while iterating on your prompt and use it to fine-tune your very own `gpt-4o-mini` as explained in the [OpenAI docs](https://platform.openai.com/docs/guides/fine-tuning).

### Stretch goal 6: User preferences

You’re really looking for an edge 💡 How can your app get to know your users better? Implement one or more of these options:

- Provide a mechanism for the user to provide feedback about the recommendations they receive and provide a new recommendation if the first one is rejected.
- Provide an input where the user can specify general preferences and figure out how best to incorporate them into your recommendations.
- Ask the user for their top 5 movies and build that information into your recommendations.
- Any similar strategy!

### Stretch goal 7: More movies!

Your users want more variety in the recommendations they receive!

- Download the full dataset from [Kaggle](https://www.kaggle.com/datasets/jrobischon/wikipedia-movie-plots).
- Preprocess the data by adding an `id` column (and entering IDs), modifying the column names to match your existing schema, and cleaning as needed (look out for empty rows!).
- Add several components to your offline data pipeline:
  - Load the CSV and parse it.
  - Create batches for OpenAI so you can [embed multiple inputs in a single request](https://platform.openai.com/docs/api-reference/embeddings/create?lang=node.js).
  - Generate embeddings for those batches. I highly recommend saving each response along the way so you don’t lose your progress!
- Upsert your new embeddings to Pinecone.

## Further extensions

First and foremost, **_make your testing more robust!_** If you want to keep iterating on this app, consider reducing costs, reducing latency, improving security, incorporating monitoring, and so on.


## Todo
- 🔍 Bonus: You may want to extend extractArticlesFromData() to include nested articles or articles[] fields.
- 🧠 NEXT UP

If you want parity with pandas.DataFrame analytics in Python:
•	Add advanced stats to getLeaderboard(): win rate, avg PnL, etc.
•	Or integrate something like duckdb-wasm for real analytics right in Node.js later.