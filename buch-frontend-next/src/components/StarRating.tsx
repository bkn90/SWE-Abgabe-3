import { Box, HStack, Text } from "@chakra-ui/react";

export function StarRating({
  value,
  max = 5,
  size = "16px",
}: {
  value?: number | null;
  max?: number;
  size?: string;
}) {
  if (value == null) {
    return <Text color="gray.500">–</Text>;
  }

  const filled = Math.max(0, Math.min(value, max));

  return (
    <HStack gap={1}>
      {Array.from({ length: max }).map((_, i) => (
        <Box
          key={i}
          as="span"
          fontSize={size}
          color={i < filled ? "yellow.400" : "gray.300"}
        >
          ★
        </Box>
      ))}

      <Text fontSize="sm" color="gray.600" ms={2}>
        {filled}/{max}
      </Text>
    </HStack>
  );
}
