export type TrainExample = {
  id: string;
  ts: string;
  guildId: string;
  userId: string;
  prompt: string;
  ideal: string;
  tags: string[];
  system?: string;
  profile?: string;
};

export type StyleRule = {
  id: string;
  ts: string;
  guildId: string;
  userId: string;
  targetUserId?: string;
  targetUserTag?: string;
  text: string;
};
