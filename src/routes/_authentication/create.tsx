import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MemeEditor } from "../../components/meme-editor";
import { useCallback, useMemo, useState } from "react";
import { MemePictureProps } from "../../components/meme-picture";
import { Plus, Trash } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { useAuthToken } from "../../contexts/authentication";
import { createMeme } from "../../api";

export const Route = createFileRoute("/_authentication/create")({
  component: CreateMemePage,
});

type Picture = {
  url: string;
  file: File;
};

function CreateMemePage() {
  const token = useAuthToken();

  const navigate = useNavigate();
  const [picture, setPicture] = useState<Picture | null>(null);
  const [texts, setTexts] = useState<MemePictureProps["texts"]>([]);
  const [description, setDescription] = useState('');

  const handleDescriptionChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textareaValue = event.target?.value;
    setDescription(textareaValue);
  }, []);

  const createFormData = useCallback(async () => {
    if (!picture) {
      // TODO: Handle error;
      return;
    }

    const formData = new FormData();

    formData.append("Description", description);

    const capitalizeFirstLetter = (string: string) => {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }
    texts.forEach((text, index) => {
      Object.entries(text).forEach(([key, value]) => {
        let parsedValue = value;
        if (typeof parsedValue === 'number') {
          parsedValue = Math.round(parsedValue);
        }
        formData.append(`Texts[${index}][${capitalizeFirstLetter(key)}]`, String(parsedValue));
      })
    })

    const pictureAsBlob = await fetch(picture.url).then(r => r.blob());
    formData.append("Picture", pictureAsBlob);

    return formData;
  }, [picture, description, texts]);

  const { mutate } = useMutation({
    mutationFn: async () => {
      const formData = await createFormData();

      if (!formData) {
        throw new Error('Implement error');
      }

      await createMeme(token, formData)
    },
    onSuccess() {
      // TODO: Handle navigation
      navigate({ to: '/' });
    },
    onError(error) {
      // TODO: see with Product what to do on Error flow
      alert("An error occurred");
      console.error(error);
      // Send to Sentry/Whatever the error logs?
    },
  });

  const handleSubmit = () => mutate()

  const handleDrop = (file: File) => {
    setPicture({
      url: URL.createObjectURL(file),
      file,
    });
  };

  const handleAddCaptionButtonClick = () => {
    setTexts([
      ...texts,
      {
        content: `New caption ${texts.length + 1}`,
        x: Math.random() * 400,
        y: Math.random() * 225,
      },
    ]);
  };

  const handleDeleteCaptionButtonClick = (index: number) => {
    setTexts(texts.filter((_, i) => i !== index));
  };

  const memePicture = useMemo(() => {
    if (!picture) {
      return undefined;
    }

    return {
      pictureUrl: picture.url,
      texts,
    };
  }, [picture, texts]);

  return (
    <Flex width="full" height="full">
      <Box flexGrow={1} height="full" p={4} overflowY="auto">
        <VStack spacing={5} align="stretch">
          <Box>
            <Heading as="h2" size="md" mb={2}>
              Upload your picture
            </Heading>
            <MemeEditor onDrop={handleDrop} memePicture={memePicture} />
          </Box>
          <Box>
            <Heading as="h2" size="md" mb={2}>
              Describe your meme
            </Heading>
            <Textarea
              onChange={handleDescriptionChange}
              placeholder="Type your description here..."
            />
          </Box>
        </VStack>
      </Box>
      <Flex
        flexDir="column"
        width="30%"
        minW="250"
        height="full"
        boxShadow="lg"
      >
        <Heading as="h2" size="md" mb={2} p={4}>
          Add your captions
        </Heading>
        <Box p={4} flexGrow={1} height={0} overflowY="auto">
          <VStack>
            {texts.map((text, index) => (
              <Flex width="full">
                {/* Input is read-only due to implementation */}
                <Input key={index} value={text.content} mr={1} />
                <IconButton
                  onClick={() => handleDeleteCaptionButtonClick(index)}
                  aria-label="Delete caption"
                  icon={<Icon as={Trash} />}
                />
              </Flex>
            ))}
            <Button
              colorScheme="cyan"
              leftIcon={<Icon as={Plus} />}
              variant="ghost"
              size="sm"
              width="full"
              onClick={handleAddCaptionButtonClick}
              isDisabled={memePicture === undefined}
            >
              Add a caption
            </Button>
          </VStack>
        </Box>
        <HStack p={4}>
          <Button
            as={Link}
            to="/"
            colorScheme="cyan"
            variant="outline"
            size="sm"
            width="full"
          >
            Cancel
          </Button>
          <Button
            colorScheme="cyan"
            size="sm"
            width="full"
            color="white"
            isDisabled={memePicture === undefined}
            onClick={handleSubmit}
          >
            Submit
          </Button>
        </HStack>
      </Flex>
    </Flex>
  );
}
