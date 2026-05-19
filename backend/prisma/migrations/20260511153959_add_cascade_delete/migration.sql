-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_clubId_fkey";

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_playerId_fkey";

-- DropForeignKey
ALTER TABLE "AttributeVerification" DROP CONSTRAINT "AttributeVerification_playerId_fkey";

-- DropForeignKey
ALTER TABLE "ClubProfile" DROP CONSTRAINT "ClubProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "ClubRequirement" DROP CONSTRAINT "ClubRequirement_clubId_fkey";

-- DropForeignKey
ALTER TABLE "Connection" DROP CONSTRAINT "Connection_connectedUserId_fkey";

-- DropForeignKey
ALTER TABLE "Connection" DROP CONSTRAINT "Connection_userId_fkey";

-- DropForeignKey
ALTER TABLE "ContactRequest" DROP CONSTRAINT "ContactRequest_clubId_fkey";

-- DropForeignKey
ALTER TABLE "ContactRequest" DROP CONSTRAINT "ContactRequest_playerId_fkey";

-- DropForeignKey
ALTER TABLE "PlayerAttributes" DROP CONSTRAINT "PlayerAttributes_playerId_fkey";

-- DropForeignKey
ALTER TABLE "PlayerClubHistory" DROP CONSTRAINT "PlayerClubHistory_clubId_fkey";

-- DropForeignKey
ALTER TABLE "PlayerClubHistory" DROP CONSTRAINT "PlayerClubHistory_playerId_fkey";

-- DropForeignKey
ALTER TABLE "PlayerProfile" DROP CONSTRAINT "PlayerProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "PlayerVideo" DROP CONSTRAINT "PlayerVideo_playerId_fkey";

-- DropForeignKey
ALTER TABLE "Rating" DROP CONSTRAINT "Rating_playerId_fkey";

-- DropForeignKey
ALTER TABLE "Recommendation" DROP CONSTRAINT "Recommendation_toPlayerId_fkey";

-- DropForeignKey
ALTER TABLE "TrialTraining" DROP CONSTRAINT "TrialTraining_clubId_fkey";

-- DropForeignKey
ALTER TABLE "TrialTraining" DROP CONSTRAINT "TrialTraining_playerId_fkey";

-- AddForeignKey
ALTER TABLE "ClubRequirement" ADD CONSTRAINT "ClubRequirement_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "ClubProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttributeVerification" ADD CONSTRAINT "AttributeVerification_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "PlayerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerClubHistory" ADD CONSTRAINT "PlayerClubHistory_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "PlayerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerClubHistory" ADD CONSTRAINT "PlayerClubHistory_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "ClubProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "PlayerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "ClubProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrialTraining" ADD CONSTRAINT "TrialTraining_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "PlayerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrialTraining" ADD CONSTRAINT "TrialTraining_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "ClubProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactRequest" ADD CONSTRAINT "ContactRequest_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "PlayerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactRequest" ADD CONSTRAINT "ContactRequest_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "ClubProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerVideo" ADD CONSTRAINT "PlayerVideo_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "PlayerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerProfile" ADD CONSTRAINT "PlayerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_connectedUserId_fkey" FOREIGN KEY ("connectedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_toPlayerId_fkey" FOREIGN KEY ("toPlayerId") REFERENCES "PlayerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubProfile" ADD CONSTRAINT "ClubProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerAttributes" ADD CONSTRAINT "PlayerAttributes_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "PlayerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "PlayerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
