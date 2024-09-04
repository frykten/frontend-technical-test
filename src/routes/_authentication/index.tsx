import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Avatar,
  Box,
  Collapse,
  Flex,
  Icon,
  LinkBox,
  LinkOverlay,
  StackDivider,
  Text,
  Input,
  VStack,
  Button,
} from "@chakra-ui/react";
import { CaretDown, CaretUp, Chat } from "@phosphor-icons/react";
import { format } from "timeago.js";
import {
  createMemeComment,
  getMemeComments,
  GetMemeCommentsResponse,
  getMemes,
  GetMemesResponse,
  getUserById,
  GetUserByIdResponse,
} from "../../api";
import { useAuthToken } from "../../contexts/authentication";
import { Loader } from "../../components/loader";
import { MemePicture } from "../../components/meme-picture";
import { useState } from "react";
import { jwtDecode } from "jwt-decode";

export const MemeFeedPage: React.FC = () => {
  const token = useAuthToken();
  
  const fetchMemes = async ({ pageParam }: { pageParam: number }) => {
    const memes: GetMemesResponse["results"] = [];
    const firstPage = await getMemes(token, pageParam);
    memes.push(...firstPage.results);
    const remainingPages =
      Math.ceil(firstPage.total / firstPage.pageSize) - 1;
    const canFetchNextPage = pageParam < remainingPages;

    const authorPromises = [];
    for (const meme of memes) {
      authorPromises.push(getUserById(token, meme.authorId));
    }
    const authors = await Promise.all([...authorPromises]);

    const commentsPromises = [];
    for (const meme of memes) {
      // TODO: need to add mechanics of occlusion or similar for multiple pages
      commentsPromises.push(getMemeComments(token, meme.id, 1));
    }
    const commentsData = await Promise.all([...commentsPromises]);

    const commentsWithAuthor: (GetMemeCommentsResponse["results"][0] & {
      author: GetUserByIdResponse;
    })[][] = [];
    for (const commentData of commentsData) {
      const commentAuthorsPromises = [];
      for (const comment of commentData.results) {
        commentAuthorsPromises.push(getUserById(token, comment.authorId));
      }
      const commentAuthors = await Promise.all([...commentAuthorsPromises]);

      const updatedComment = commentData.results.map((comment, index) => ({ ...comment, author: commentAuthors[index] }));
      commentsWithAuthor.push(updatedComment);
    }

    const memesWithAuthor = memes.map((meme, index) => ({
      ...meme,
      author: authors.find((author) => author.id === meme.authorId) ?? {
        username: 'Anonymous',
        pictureUrl: '', // no partial in typing?
        id: '',
      },
      comments: commentsWithAuthor[index],
    }))

    return {
      memes: memesWithAuthor,
      nextCursor: canFetchNextPage ? pageParam + 1 : null,
    };
  }

  const {
    isLoading,
    data: memes,
    hasNextPage,
    fetchNextPage,
    isFetching,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["memes"],
    queryFn: fetchMemes,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      return await getUserById(token, jwtDecode<{ id: string }>(token).id);
    },
  });

  const [openedCommentSection, setOpenedCommentSection] = useState<
    string | null
  >(null);

  const [commentContent, setCommentContent] = useState<{
    [key: string]: string;
  }>({});

  const { mutate } = useMutation({
    mutationFn: async (data: { memeId: string; content: string, pageIndex: number }) => {
      const comment = await createMemeComment(token, data.memeId, data.content);
      // TODO: check with UX if optimistic refresh only or if need to check success/error
      const memeWithNewComment = memes?.pages[data.pageIndex].memes.find((meme) => meme.id === data.memeId);
      // TODO: need "invariant" or a library as such to avoid these TS-check errors
      if (user) {
        memeWithNewComment?.comments.unshift({ ...comment, author: user });
      }
    },
  });

  if (isLoading) {
    return <Loader data-testid="meme-feed-loader" />;
  }
  return (
    <Flex width="full" height="full" alignItems="center" overflowY="auto" flexDirection="column">
      {/* TODO Add occlusion/virtualization */}
      <VStack
        p={4}
        width="full"
        maxWidth={800}
        divider={<StackDivider border="gray.200" />}
      >
        {/* TODO Add Memoification */}
        {memes?.pages.map((page, pageIndex) => {
          return page.memes.map((meme) => {
            return (
              <VStack key={meme.id} p={4} width="full" align="stretch">
                <Flex justifyContent="space-between" alignItems="center">
                  <Flex>
                    <Avatar
                      borderWidth="1px"
                      borderColor="gray.300"
                      size="xs"
                      name={meme.author.username}
                      src={meme.author.pictureUrl}
                    />
                    <Text ml={2} data-testid={`meme-author-${meme.id}`}>{meme.author.username}</Text>
                  </Flex>
                  <Text fontStyle="italic" color="gray.500" fontSize="small">
                    {format(meme.createdAt)}
                  </Text>
                </Flex>
                <MemePicture pictureUrl={meme.pictureUrl} texts={meme.texts} dataTestId={`meme-picture-${meme.id}`} />
                <Box>
                  <Text fontWeight="bold" fontSize="medium" mb={2}>
                    Description:{" "}
                  </Text>
                  <Box
                    p={2}
                    borderRadius={8}
                    border="1px solid"
                    borderColor="gray.100"
                  >
                    <Text color="gray.500" whiteSpace="pre-line" data-testid={`meme-description-${meme.id}`}>
                      {meme.description}
                    </Text>
                  </Box>
                </Box>
                <LinkBox as={Box} py={2} borderBottom="1px solid black">
                  <Flex justifyContent="space-between" alignItems="center">
                    <Flex alignItems="center">
                      <LinkOverlay
                        // Lack of accessibility dirtily fixed
                        aria-label="Open comments' section"
                        role="button"
                        data-testid={`meme-comments-section-${meme.id}`}
                        cursor="pointer"
                        onClick={() =>
                          setOpenedCommentSection(
                            openedCommentSection === meme.id ? null : meme.id,
                          )
                        }
                      >
                        <Text data-testid={`meme-comments-count-${meme.id}`}>{meme.commentsCount} comments</Text>
                      </LinkOverlay>
                      <Icon
                        as={
                          openedCommentSection !== meme.id ? CaretDown : CaretUp
                        }
                        ml={2}
                        mt={1}
                      />
                    </Flex>
                    <Icon as={Chat} />
                  </Flex>
                </LinkBox>
                <Collapse in={openedCommentSection === meme.id} animateOpacity>
                  <Box mb={6}>
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        if (commentContent[meme.id]) {
                          mutate({
                            memeId: meme.id,
                            content: commentContent[meme.id],
                            pageIndex
                          });
                        }
                      }}
                    >
                      <Flex alignItems="center">
                        <Avatar
                          borderWidth="1px"
                          borderColor="gray.300"
                          name={user?.username}
                          src={user?.pictureUrl}
                          size="sm"
                          mr={2}
                        />
                        <Input
                          placeholder="Type your comment here..."
                          onChange={(event) => {
                            setCommentContent({
                              ...commentContent,
                              [meme.id]: event.target.value,
                            });
                          }}
                          value={commentContent[meme.id]}
                        />
                      </Flex>
                    </form>
                  </Box>
                  <VStack align="stretch" spacing={4}>
                    {meme.comments.map((comment) => (
                      <Flex key={comment.id}>
                        <Avatar
                          borderWidth="1px"
                          borderColor="gray.300"
                          size="sm"
                          name={comment.author.username}
                          src={comment.author.pictureUrl}
                          mr={2}
                        />
                        <Box p={2} borderRadius={8} bg="gray.50" flexGrow={1}>
                          <Flex
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Flex>
                              <Text data-testid={`meme-comment-author-${meme.id}-${comment.id}`}>{comment.author.username}</Text>
                            </Flex>
                            <Text
                              fontStyle="italic"
                              color="gray.500"
                              fontSize="small"
                            >
                              {format(comment.createdAt)}
                            </Text>
                          </Flex>
                          <Text color="gray.500" whiteSpace="pre-line" data-testid={`meme-comment-content-${meme.id}-${comment.id}`}>
                            {comment.content}
                          </Text>
                        </Box>
                      </Flex>
                    ))}
                  </VStack>
                </Collapse>
              </VStack>
            );
          })
        })}
      </VStack>
      {/* TODO Add infinite scrolling rather lazy button */}
      <div style={{marginBottom: '2rem' }}>
        <Button
          onClick={() => fetchNextPage()}
          disabled={!hasNextPage || isFetchingNextPage}
        >
          {isFetchingNextPage
            ? 'Loading more...'
            : hasNextPage
              ? 'Load More'
              : 'Nothing more to load'}
        </Button>
        <div>{isFetching && !isFetchingNextPage ? 'Fetching...' : null}</div>
      </div>
    </Flex>
  );
};

export const Route = createFileRoute("/_authentication/")({
  component: MemeFeedPage,
});
