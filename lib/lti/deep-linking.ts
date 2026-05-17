/**
 * LTI 1.3 Deep Linking response builder.
 */

import { SignJWT } from 'jose';
import { getPrivateKey } from './keys';

export interface DeepLinkingContentItem {
  type: 'ltiResourceLink';
  title: string;
  url: string;
  lineItem?: {
    scoreMaximum: number;
    label: string;
  };
}

export async function buildDeepLinkingResponse(
  contentItems: DeepLinkingContentItem[],
  platform: {
    clientId: string;
    issuer: string;
    deploymentId: string;
  },
  deepLinkingSettings: {
    deep_link_return_url: string;
    accept_presentation_document_targets: string[];
    data?: string;
  },
): Promise<{ jwt: string; returnUrl: string }> {
  const privateKey = await getPrivateKey();

  const jwt = await new SignJWT({
    'https://purl.imsglobal.org/spec/lti/claim/message_type': 'LtiDeepLinkingResponse',
    'https://purl.imsglobal.org/spec/lti/claim/version': '1.3.0',
    'https://purl.imsglobal.org/spec/lti/claim/deployment_id': platform.deploymentId,
    'https://purl.imsglobal.org/spec/lti-dl/claim/content_items': contentItems.map((item) => ({
      type: item.type,
      title: item.title,
      url: item.url,
      ...(item.lineItem && {
        lineItem: item.lineItem,
      }),
    })),
    'https://purl.imsglobal.org/spec/lti-dl/claim/data': deepLinkingSettings.data,
  })
    .setProtectedHeader({ alg: 'RS256', kid: 'luxup-tutor-key-1' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .setIssuer(platform.clientId)
    .setAudience(platform.issuer)
    .sign(privateKey);

  return {
    jwt,
    returnUrl: deepLinkingSettings.deep_link_return_url,
  };
}
