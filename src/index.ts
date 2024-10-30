import { Address, harden, TxBuilder, Value, XPrv } from "@harmoniclabs/plu-ts";
import { BlockfrostPluts } from "@harmoniclabs/blockfrost-pluts";
import { mnemonicToEntropy } from "bip39";
import dotenv from "dotenv";

dotenv.config();
let senderIndex = 0;

console.log(">>> 0 <<<");

async function triggerTx() 
{
    console.log("> --------------------- ", senderIndex, " --------------------- <");

    const xprv = XPrv.fromEntropy(
        mnemonicToEntropy( 
            senderIndex === 0 ? process.env.FIRST_SEED_PHRASE! : process.env.SECOND_SEED_PHRASE! 
        )
    );

    console.log(">>> 5 <<<");

    const senderAddr = Address.fromXPrv( xprv, "testnet" );

    console.log(">>> ", senderAddr.toString(), " <<<");

    const blockfrost = new BlockfrostPluts({
        projectId: process.env.BLOCKFROST_API_KEY!
    });

    console.log(">>> 6 <<<");

    const utxos = await blockfrost.addressUtxos( senderAddr );

    console.log(">>> 7 <<<");

    const receiverAddr = Address.fromString( 
        senderIndex === 0 ? process.env.SECOND_ADDRESS! : process.env.FIRST_ADDRESS! 
    );

    console.log(">>> 8 <<<");

    const txBuilder = new TxBuilder(
        await blockfrost.getProtocolParameters()
    );

    console.log(">>> 9 <<<");

    const tx = txBuilder.buildSync({
        inputs: [
            { utxo: utxos[0] }
        ],
        changeAddress: senderAddr,
        outputs: [
            {
                address: receiverAddr,
                value: Value.lovelaces( 50_000_000 )
            }
        ]
    });

    console.log(">>> 10 <<<");

    const privateKey = (
        xprv
        .derive(harden(1852))
        .derive(harden(1815))
        .derive(harden(0))
        .derive(0)
        .derive(0)
    );

    console.log(">>> 11 <<<");

    tx.signWith( privateKey );

    console.log(">> ",
        JSON.stringify(
            tx.toJson(),
            undefined,
            2
        )
    , " <<");

    await blockfrost.submitTx( tx );

    console.log("> ", tx.hash.toString(), " <");

    senderIndex = senderIndex === 0 ? 1 : 0;

    console.log("> --------------------------------------------------------------- <");
}

async function main() {
    while( true )
    {
        console.log(">>> 2 <<<");

        await triggerTx();
        await new Promise(( resolve ) => setTimeout( resolve, 60 * 1000 ));

        console.log(">>> 3 <<<");
    }
}

main();