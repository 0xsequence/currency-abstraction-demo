import { Box, Text } from '@0xsequence/design-system'

export const Footer = () => {
  return (
    <Box>
      <Text color="text100" variant="small">
        Want to learn more? Read the&nbsp;
        <Text color="text100" as="a" href={'https://docs.sequence.xyz/'} target="_blank" rel="noreferrer ">
          docs
        </Text>
        !
      </Text>
    </Box>
  )
}
