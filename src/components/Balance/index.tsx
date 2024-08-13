import { Box, Text, Spinner, useMediaQuery } from "@0xsequence/design-system";
import { useAccount } from "wagmi";

import { useBalance } from "../../hooks/data";
import { useSalesCurrency } from "../../hooks/useSalesCurrency";
import { CHAIN_ID } from "../../constants";
import { utils as etherUtils } from "ethers";
import { SwapButton } from "./SwapButton";

export const Balance = () => {
  const isMobile = useMediaQuery("isMobile");
  const { address: userAddress } = useAccount();

  const { data: currencyData, isLoading: currencyIsLoading } =
    useSalesCurrency();

  const currencyAddress = currencyData?.address || "";

  const { data: currencyBalanceData, isLoading: currencyBalanceIsLoading } =
    useBalance({
      accountAddress: userAddress || "",
      contractAddress: currencyAddress,
      chainId: CHAIN_ID,
      includeMetadata: false,
      verifiedOnly: false,
    });

  const isLoading = currencyBalanceIsLoading || currencyIsLoading;

  if (isLoading) {
    return (
      <Box
        margin="2"
        color="text100"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        gap="2"
      >
        <Text color="text100">Loading...</Text>
        <Spinner />
      </Box>
    );
  }

  const currencyBalance = BigInt(currencyBalanceData?.[0]?.balance || 0);

  return (
    <Box
      margin="2"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      gap="2"
    >
      <Box
        justifyContent="space-between"
        {...(isMobile ? { flexDirection: "column" } : {})}
      >
        <Text variant="normal" color="text100" style={{ minWidth: 205 }}>
          {currencyData?.name} Balance: &nbsp;
        </Text>
        <Text variant="normal" color="text100">
          {etherUtils.formatEther(currencyBalance)} {currencyData?.symbol}
        </Text>
      </Box>
      {currencyData && <SwapButton currencyInfo={currencyData} />}
    </Box>
  );
};
