import { Button, HStack } from "@chakra-ui/react";

export function StarRatingInput({
  value,
  onChange,
  max = 5,
  size = "24px",
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  size?: string;
}) {
  return (
    <HStack gap={1}>
      {Array.from({ length: max }).map((_, i) => {
        const starValue = i + 1;
        const active = starValue <= value;

        return (
          <Button
            key={starValue}
            type="button"
            onClick={() => onChange(starValue)}
            variant="ghost"
            p={0}
            minW="auto"
            h="auto"
            fontSize={size}
            lineHeight="1"
            color={active ? "yellow.400" : "gray.300"}
            _hover={{ color: "yellow.500" }}
          >
            ★
          </Button>
        );
      })}
    </HStack>
  );
}
