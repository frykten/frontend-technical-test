# Self-review

The "pair" review is a well-known process, used throughout the daily tasks (ie. Pull requests) and will be used by he interviewers during the application at Mozzaik365.
However, a self-review, is still an useful tool to improve. I'll share here my own notes with you, as a "ranom" midstep/note in my working process and your application one.

## Time management

Allocating time: 4h is usually the min-max/average/requested time for technical tests. At first, I aimed to copy that pattern here, but it soon went down to "maybe 5h", which I broke down into three sessions "two hours" sessions.

I noted down my own times (I track more-or-less-precisely some of my tasks, as a way to improve my self performance and to intercept when "side tasks" are taking up too much time and are decreasing my efficiency, usually with Clockify or an external tool):

Non-technical tasks (about 30mn)

* Reading the project and the tasks: 2-3mn
* Downloading the project + Analysis of the codebase: 7-8mn
* Recon on the live application + tests: 7-8mn
* Wrapping up with this self-review: 15mn

Technical tasks (about 6h30, wa too much)

* Exo 1 (about 3h20)
* Exo 2 (about 2h10)
* Exo 3 (about 1h10)

## Analysis of the deliverables

### Exo 1

In the end, I am not satisfied with the work given: I spent too much time going up and down in the file, because I did not want to immediately break the component own in to smaller parts; that would have given more work during the review process, but that would certainly have been quicker for me, going for a quick split. And the perfs are still shaky: too much data is requested at once, while the best solution would be to fetch and display the memes, then the comments.
Furthermore, I lost some time, not seeing immediately that the one request that was taking the most time was just the same request with the same params being requested hundreds of times. Since I did not breakdown the components and the request was handled only by fetch and not cached on tanstack-query, I went for a dirty fix, instead of a cleaner one (the force-cache property).

About the todos, you'll find roaming around: they are mostly "if the task was to be done seriously and iteratively"; they are flags for both what is left to be done by myself on my current task (some subsists still here in this exercise), and, when delivered, for the work to be done on the next iteration (whether it should be the dev will be myself or someone else).

### Exo 2

No technical issue with adding an "optimistic" refresh after submitting the mutation.
Most of the time taken was to look quickly a vitest, some APIs, and trying to mock fetch (testing the implementation is an old habit from my previous company), which I abandonned after reading on mws's documentation their "do not". Also, in the end, the test is failing due to an issue on refreshing the DOM, which I did not investigate further.

Once again, I feel disappointed at myself for not breaking everything down: I would have simply duplicated the first test in the suite lower down, and split it for each component, this way the fetching/mutating would have been written simpler (and simpler is often better when coding, both performance-wise and readably-wise) and the DOM issue should certainly not happen.

### Exo 3

Had to read the documentation on multipart forms, for the Array of objects. Otherwise, no issue, mostly just discovering the code, writing new lines, and dev-testing.

Neutral on the job done here (nothing good, nothing bad, it felt plain, but I may have missed the point).as