/**
 * LTI 1.3 type definitions.
 */

/** Registered LTI platform (e.g., a Moodle instance). */
export interface LtiPlatformConfig {
  id: string;
  issuer: string;
  clientId: string;
  deploymentId: string;
  authEndpoint: string;
  tokenEndpoint?: string;
  jwksUri: string;
  name?: string;
}

/** LTI 1.3 resource link launch claims (from id_token JWT payload). */
export interface LtiResourceLinkLaunch {
  iss: string;
  sub: string;
  aud: string[];
  azp?: string;
  nonce: string;
  exp: number;
  iat: number;
  'https://purl.imsglobal.org/spec/lti/claim/message_type': 'LtiResourceLinkRequest';
  'https://purl.imsglobal.org/spec/lti/claim/version': string;
  'https://purl.imsglobal.org/spec/lti/claim/deployment_id': string;
  'https://purl.imsglobal.org/spec/lti/claim/target_link_uri'?: string;
  'https://purl.imsglobal.org/spec/lti/claim/resource_link'?: {
    id: string;
    title?: string;
    description?: string;
  };
  'https://purl.imsglobal.org/spec/lti/claim/context'?: {
    id: string;
    label?: string;
    title?: string;
    type?: string[];
  };
  'https://purl.imsglobal.org/spec/lti/claim/tool_platform'?: {
    guid?: string;
    name?: string;
    version?: string;
    product_family_code?: string;
  };
  'https://purl.imsglobal.org/spec/lti/claim/roles': string[];
  'https://purl.imsglobal.org/spec/lti/claim/ext'?: Record<string, unknown>;
  name?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  // AGS (Assignment and Grade Services) claims
  'https://purl.imsglobal.org/spec/lti-ags/claim/endpoint'?: {
    lineitems?: string;
    lineitem?: string;
  };
  'https://purl.imsglobal.org/spec/lti-ags/claim/scope'?: string[];
}

/** LTI 1.3 Deep Linking launch claims. */
export interface LtiDeepLinkingLaunch extends Omit<LtiResourceLinkLaunch, 'https://purl.imsglobal.org/spec/lti/claim/message_type'> {
  'https://purl.imsglobal.org/spec/lti/claim/message_type': 'LtiDeepLinkingRequest';
  'https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings': {
    accept_types: string[];
    accept_presentation_document_targets: string[];
    accept_multiple: boolean;
    auto_create: boolean;
    title?: string;
    text?: string;
    data?: string;
    deep_link_return_url: string;
  };
}

/** Union type for any LTI launch. */
export type LtiLaunch = LtiResourceLinkLaunch | LtiDeepLinkingLaunch;
