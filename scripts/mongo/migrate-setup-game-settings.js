db.setups.updateMany(
  { },
  [
    {
      $set: {
        gameSettings: {
          $arrayToObject: {
            $concatArrays: [
              [],
              { $cond: [{ $eq: ["$startState", "Day"] }, [["Day Start", true]], []] },
              { $cond: [{ $eq: ["$whispers", true] }, [["Whispers", true]], []] },
              { $cond: [{ $and: [
                { $gt: ["$leakPercentage", 0] },
                { $eq: ["$whispers", true] },
              ]}, [["Whisper Leak Chance", "$leakPercentage"]], []] },
              { $cond: [{ $eq: ["$mustAct", true] }, [["Must Act", true]], []] },
              { $cond: [{ $eq: ["$noReveal", true] }, [["No Reveal", true]], []] },
              { $cond: [{ $eq: ["$alignmentReveal", true] }, [["Alignment Only Reveal", true]], []] },
              { $cond: [{ $eq: ["$mustCondemn", true] }, [["Must Condemn", true]], []] },
              { $cond: [{ $eq: ["$votesInvisible", true] }, [["Hidden Votes", true]], []] },
              { $cond: [{ $eq: ["$majorityVoting", true] }, [["Majority Voting", true]], []] },
              { $cond: [{ $eq: ["$votingDead", true] }, [["Voting Dead", true]], []] },
              { $cond: [{ $eq: ["$RoleShare", true] }, [["Role Sharing", true]], []] },
              { $cond: [{ $eq: ["$AlignmentShare", true] }, [["Alignment Sharing", true]], []] },
              { $cond: [{ $eq: ["$PrivateShare", true] }, [["Private Revealing", true]], []] },
              { $cond: [{ $eq: ["$PublicShare", true] }, [["Public Revealing", true]], []] },
              { $cond: [{ $eq: ["$talkingDead", true] }, [["Talking Dead", true]], []] },
              { $cond: [{ $eq: ["$hiddenConverts", true] }, [["Hidden Conversions", true]], []] },
              { $cond: [{ $eq: ["$lastWill", true] }, [["Last Wills", true]], []] },
              { $cond: [{ $eq: ["$HostileVsMafia", true] }, [["Hostiles Vs Mafia", true]], []] },
              { $cond: [{ $eq: ["$CultVsMafia", true] }, [["Competing Evil Factions", true]], []] },
            ]
          }
        }
      }
    }
  ]
)