import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy, Profile } from 'passport-facebook'

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor() {
    super({
      clientID: process.env.FACEBOOK_APP_ID!,
      clientSecret: process.env.FACEBOOK_APP_SECRET!,
      callbackURL: process.env.FACEBOOK_REDIRECT_URI!,
      scope: [
        'email',
        'public_profile',
        'ads_management',
        'ads_read',
        'business_management',
        'read_insights',
      ],
      profileFields: ['id', 'emails', 'name', 'displayName'],
    })
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: any, user: any, info?: any) => void,
  ): Promise<any> {
    const { id, emails, displayName } = profile

    const user = {
      facebookId: id,
      email: emails?.[0]?.value,
      name: displayName,
      accessToken,
      refreshToken,
    }

    done(null, user)
  }
}
