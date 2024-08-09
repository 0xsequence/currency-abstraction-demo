import { Box, Text, Image } from '@0xsequence/design-system'

export const Header = () => {
  return (
    <>
      <Text as="h2" variant="lg" color="text100" marginBottom="0">
        NFT Checkout Demo
      </Text>
      <Image src="sequence-icon-cropped.png" style={{ maxWidth: 100 }} />
      <Box marginTop="5" marginBottom="4" style={{ maxWidth: 600 }}>
        <Text color="text100">This demo was created with&nbsp;
          <Text 
            color="text100"
            as="a"
            href={
              "https://sequence.build"
            }
            target="_blank"
            rel="noreferrer "
          >
           Sequence Builder
          </Text>, a tool for developing NFT collections and related sales contracts for minting new tokens. It also shows how you can make purchases with a credit card.
        </Text>
      </Box>
    </>
  )
}