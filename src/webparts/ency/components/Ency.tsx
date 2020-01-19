import * as React from 'react';
import { IEncyProps } from './IEncyProps';
import { escape } from '@microsoft/sp-lodash-subset';
import * as sjcl from 'sjcl';
import { PrimaryButton } from 'office-ui-fabric-react/lib/Button';

export default class Ency extends React.Component<IEncyProps, {}> {

  public testEncy() {

    if (sjcl.random.isReady(1)) {
      // let pair = sjcl.ecc.elGamal.generateKeys(256, 1);
      // let pub = pair.pub.get(), sec = pair.sec.get();

      let pair = sjcl.ecc.elGamal.generateKeys(256, 1);
      let pub = pair.pub.get(), sec = pair.sec.get();

      // Serialized public key:
      let pubBase64 = sjcl.codec.base64.fromBits(pub.x.concat(pub.y));
      // uQuXH/yeIpQq8hCWiwCTIMKdsaX...

      // Unserialized public key:
      let pubUnser = new sjcl.ecc.elGamal.publicKey(
        sjcl.ecc.curves.c256,
        sjcl.codec.base64.toBits(pubBase64)
      );

      // Serialized private key:
      // let secSer = sjcl.codec.base64.fromBits(sec);
      // IXkJSpYK3RHRaVrd...

      // // Unserialized private key:

      // let secUnser = new sjcl.ecc.elGamal.secretKey(
      //   sjcl.ecc.curves.c256,
      //   sjcl.ecc.curves.c256.fromBits(sjcl.codec.base64.toBits(secSer)) as any
      // );

      var ct = sjcl.encrypt(pair.pub, "Hello World!");
      var pt = sjcl.decrypt(pair.sec, ct);
    }


  }

  public render(): React.ReactElement<IEncyProps> {

    return (
      <div>
        {/* <PrimaryButton ></PrimaryButton> */}
      </div>
    );
  }
}
