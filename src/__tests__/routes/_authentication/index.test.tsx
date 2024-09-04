import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { ChakraProvider } from "@chakra-ui/react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { AuthenticationContext } from "../../../contexts/authentication";
import { MemeFeedPage } from "../../../routes/_authentication/index";
import { renderWithRouter } from "../../utils";

describe("routes/_authentication/index", () => {
  let _originalScrollTo: () => void;
  beforeEach(() => {
    _originalScrollTo = window.scrollTo
    window.scrollTo = () => void 0;
  })

  afterAll(() => {
    window.scrollTo = _originalScrollTo;
  })

  describe("MemeFeedPage", () => {
    function renderMemeFeedPage() {
      return renderWithRouter({
        component: MemeFeedPage,
        Wrapper: ({ children }) => (
          <ChakraProvider>
            <QueryClientProvider client={new QueryClient()}>
              <AuthenticationContext.Provider
                value={{
                  state: {
                    isAuthenticated: true,
                    userId: "dummy_user_id",
                    token: "dummy_token",
                  },
                  authenticate: () => {},
                  signout: () => {},
                }}
              >
                {children}
              </AuthenticationContext.Provider>
            </QueryClientProvider>
          </ChakraProvider>
        ),
      });
    }

    it("should fetch the memes and display them with their comments", async () => {
      renderMemeFeedPage();

      await waitFor(() => {
        // We check that the right author's username is displayed
        expect(screen.getByTestId("meme-author-dummy_meme_id_1")).toHaveTextContent('dummy_user_1');
        
        // We check that the right meme's picture is displayed
        expect(screen.getByTestId("meme-picture-dummy_meme_id_1")).toHaveStyle({
          'background-image': 'url("https://dummy.url/meme/1")',
        });

        // We check that the right texts are displayed at the right positions
        const text1 = screen.getByTestId("meme-picture-dummy_meme_id_1-text-0");
        const text2 = screen.getByTestId("meme-picture-dummy_meme_id_1-text-1");
        expect(text1).toHaveTextContent('dummy text 1');
        expect(text1).toHaveStyle({
          'top': '0px',
          'left': '0px',
        });
        expect(text2).toHaveTextContent('dummy text 2');
        expect(text2).toHaveStyle({
          'top': '100px',
          'left': '100px',
        });

        // We check that the right description is displayed
        expect(screen.getByTestId("meme-description-dummy_meme_id_1")).toHaveTextContent('dummy meme 1');
        
        // We check that the right number of comments is displayed
        expect(screen.getByTestId("meme-comments-count-dummy_meme_id_1")).toHaveTextContent('3 comments');
        
        // We check that the right comments with the right authors are displayed
        expect(screen.getByTestId("meme-comment-content-dummy_meme_id_1-dummy_comment_id_1")).toHaveTextContent('dummy comment 1');
        expect(screen.getByTestId("meme-comment-author-dummy_meme_id_1-dummy_comment_id_1")).toHaveTextContent('dummy_user_1');

        expect(screen.getByTestId("meme-comment-content-dummy_meme_id_1-dummy_comment_id_2")).toHaveTextContent('dummy comment 2');
        expect(screen.getByTestId("meme-comment-author-dummy_meme_id_1-dummy_comment_id_2")).toHaveTextContent('dummy_user_2');
        
        expect(screen.getByTestId("meme-comment-content-dummy_meme_id_1-dummy_comment_id_3")).toHaveTextContent('dummy comment 3');
        expect(screen.getByTestId("meme-comment-author-dummy_meme_id_1-dummy_comment_id_3")).toHaveTextContent('dummy_user_3');
      });
    });

    // Used the GWT pattern here to describe more precisely everything that is checked and in the right order
    it(`
      Given a loaded Meme Feed page
      Then the comments exists
        But they are hidden
        And the "Add comment" input exists
        But it is hidden
    `, async () => {
      renderMemeFeedPage();

      // GIVEN
      await waitFor(() => {
        // Serves as a naive 'page is loaded'
        expect(screen.getByTestId("meme-author-dummy_meme_id_1")).toHaveTextContent('dummy_user_1');
      });

      // TODO: need to refactor and breakdown in smaller units to be able to test unitely
      const comments = screen.getAllByTestId("meme-comment");
      const firstComment = comments[0];
      // Testing sections this way
      const commentData = within(firstComment).getByTestId("meme-comment-content-dummy_meme_id_1-dummy_comment_id_1");
      expect(commentData).toBeInTheDocument();
      expect(commentData).not.toBeVisible();

      // Using label text is a more precise pattern for UTs and allows to verify the HTML integrity an the accesibility strength
      const input = screen.getByLabelText("Add a comment on meme");
      expect(input).toBeInTheDocument();
      expect(input).not.toBeVisible();
    });

    it(`
      Given a loaded Meme Feed page
      When I open the comment section
      Then the comments are visible
        And the "Add comment" input is visible
        // And I focus the "Add comment" input
        // And I fill-in an 
    `, async () => {
      renderMemeFeedPage();

      // GIVEN
      await waitFor(() => {
        // Serves as a naive 'page is loaded'
        expect(screen.getByTestId("meme-author-dummy_meme_id_1")).toHaveTextContent('dummy_user_1');
      });

      // TODO: Add "user-event" as it copies real user interactions, rather than mere dom events
      await fireEvent.click(
        screen.getByRole('button', { name: "Open comments' section" })
      );

      await waitFor(() => {
        // TODO' need to refactor and breakdown in smaller units to be able to test unitely
        const comments = screen.getAllByTestId("meme-comment");
        const firstComment = comments[0];
        // Testing sections this way
        const commentData = within(firstComment).getByTestId("meme-comment-content-dummy_meme_id_1-dummy_comment_id_1");
        expect(commentData).toBeVisible();
      });

      // Using label text is a more precise pattern for UTs and allows to verify the HTML integrity an the accesibility strength
      const input = screen.getByLabelText("Add a comment on meme");
      expect(input).toBeVisible();
    });

    it(`
      Given a loaded Meme Feed page
        And a mocked create-meme-comment request
      When I open the comment section
        And I focus the "Add comment" input
        And I fill-in a comment text
        And I send the form
      Then the correct comment text is sent to the request
        And the new comment is displayed
        And the previous comments are still displayed
    `, async () => {
      renderMemeFeedPage();

      // GIVEN
      await waitFor(() => {
        // Serves as a naive 'page is loaded'
        expect(screen.getByTestId("meme-author-dummy_meme_id_1")).toHaveTextContent('dummy_user_1');
      });

      // TODO: Add "user-event" as it copies real user interactions, rather than mere dom events
      await fireEvent.click(
        screen.getByRole('button', { name: "Open comments' section" })
      );

      const comments = screen.getAllByTestId("meme-comment");
      const input = await screen.findByLabelText("Add a comment on meme");

      await waitFor(() => {
        expect(input).toBeVisible();
      });

      const commentText = 'Need Faker or such library to generate random data for testing';
      await fireEvent.change(
        input,
        {
          target: { value: commentText }
        }
      );
      await fireEvent.keyDown(input, {key: 'Enter', code: 'Enter', charCode: 13});
      await fireEvent.submit(input);

      // TODO: Fix the test as the DOM list is not refreshed
      await waitFor(() => {
        const newComments = screen.getAllByTestId("meme-comment");
        expect(within(newComments[0]).getByText(commentText)).toBeVisible();
        assert(
          newComments.length - comments.length === 1,
          'There is one new comment and old comments still exists'
        );
      })
    });
  });
});
