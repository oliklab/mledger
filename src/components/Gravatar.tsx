"use client";

import React, { useState, useEffect } from 'react';

interface GravatarProfile {
  avatar_url: string;
  display_name: string;
  job_title?: string;
  company?: string;
  pronunciation?: string;
  pronouns?: string;
  location?: string;
  description?: string;
  profile_url: string;
  verified_accounts?: {
    service_label: string;
    url: string;
    service_icon: string;
  }[];
}

export default function GravatarCard({ email, fallback }: { email: string | null | undefined, fallback: React.ReactNode }) {
  const [gravatarProfile, setGravatarProfile] = useState<GravatarProfile | null>(null);
  const [gravatarLoading, setGravatarLoading] = useState(true);

  useEffect(() => {
    const fetchGravatarProfile = async () => {
      if (!email) {
        setGravatarLoading(false);
        return;
      }
      setGravatarLoading(true);
      try {
        const response = await fetch(`/api/profile?email=${email}`);
        if (response.ok) {
          const data = await response.json();
          if (data && !data.error) {
            setGravatarProfile(data);
          } else {
            setGravatarProfile(null);
          }
        } else {
          setGravatarProfile(null);
        }
      } catch (error) {
        console.error("Failed to fetch Gravatar profile", error);
        setGravatarProfile(null);
      } finally {
        setGravatarLoading(false);
      }
    };
    fetchGravatarProfile();
  }, [email]);

  if (gravatarLoading) {
    return <div className="p-4 text-center text-sm text-gray-500">Loading Gravatar Profile...</div>;
  }

  if (gravatarProfile) {
    return (
      <div className="gravatar-card">
        <img src={gravatarProfile.avatar_url + '?size=256'} className="gravatar-card__avatar" alt="Gravatar" />
        <h1 className="gravatar-card__name">{gravatarProfile.display_name}</h1>
        <div className="gravatar-card__meta">
          <div>
            {gravatarProfile.job_title && (<span>{gravatarProfile.job_title}{gravatarProfile.company && (', ')}</span>)}
            {gravatarProfile.company && (<span>{gravatarProfile.company}</span>)}
          </div>
          <div className="gravatar-card__meta-personal">
            {gravatarProfile.pronunciation && (<><span>{gravatarProfile.pronunciation}</span>{gravatarProfile.pronouns && (<span>·</span>)}</>)}
            {gravatarProfile.pronouns && (<><span>{gravatarProfile.pronouns}</span>{gravatarProfile.location && (<span>·</span>)}</>)}
            {gravatarProfile.location && (<span>{gravatarProfile.location}</span>)}
          </div>
        </div>
        <p className="gravatar-card__description">{gravatarProfile.description}</p>
        <div className="gravatar-card__network">
          <a href={gravatarProfile.profile_url}>
            <img src="https://secure.gravatar.com/icons/gravatar.svg" alt="Gravatar Profile" />
          </a>
          {gravatarProfile.verified_accounts?.slice(0, 3).map((acc: any) =>
            <a key={acc.service_label} href={acc.url}>
              <img src={acc.service_icon} alt={acc.service_label} />
            </a>
          )}
        </div>
      </div>
    );
  }

  return <>{fallback}</>;
}
