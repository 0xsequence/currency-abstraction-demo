import { Card, Image } from '@0xsequence/design-system'

interface CollectibleTileImageProps {
  imageUrl?: string
}

export const CollectibleTileImage = ({ imageUrl }: CollectibleTileImageProps) => {
  return (
    <Card
      padding="0"
      aspectRatio="1/1"
      justifyContent="center"
      alignItems="center"
      overflow="hidden"
      borderRadius="sm"
      background="backgroundSecondary"
      width="full"
    >
      <Image style={{ width: '100%' }} src={imageUrl} />
    </Card>
  )
}
