# Meme Feed Code Review

## List of issues

### Performance

Man issue: everything is fetched immediately. As the whole page and algorithmn was written as an "all-inclusive", it has lots of smaller issues.

* Too much data: most of the data fetched here is not displayed (whether it is the 11th meme that may never be viewed by the user, or the comments that need a click to be displayed):
  * all the queries with pages should use the "infinite" API (we do not want to fetch unnecessary data);
  * comments should be fetched on click;
  * we could also use Promise.allSettled for concurrent fetching if concurrence is needed (e.g. fetching all authors when we have received the memes);
  * data for authors could be cached by using react-query rather than a straightforward "fetch": there is no need to fetch multiple times the same author if we got his data aleady;
* Lack of occlusion: long lists in html creates performances issues, this can be fixed with occlusion/virtualization of the listitems;
* Memoification: should a property update and re-render the page, the whole list may be re-rendered, this should be fixed with memoiziing the list/listitems;

### Code clarity

The code could be broken down to facilitate refactorings (such as the memoization).

Breaking it in smaller components could facilitate fixing most of the issues: having each "meme" as a sub-component could permit more easily to fetch the comments only when the meme is displayed (no need to fetch data that will never be rendered).