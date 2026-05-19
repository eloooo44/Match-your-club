export interface CreateClubRequirementBody {
  position: string;

  minTempo: number;
  minShooting: number;
  minPassing: number;
  minDribbling: number;
  minDefending: number;
  minPhysical: number;

  tempoWeight?: number;
  shootingWeight?: number;
  passingWeight?: number;
  dribblingWeight?: number;
  defendingWeight?: number;
  physicalWeight?: number;

  requiredSkills?: string[] | string;
  highlightedSkills?: string[] | string;

  description?: string;
}

export interface UpdateClubRequirementBody {
  position?: string;

  minTempo?: number;
  minShooting?: number;
  minPassing?: number;
  minDribbling?: number;
  minDefending?: number;
  minPhysical?: number;

  tempoWeight?: number;
  shootingWeight?: number;
  passingWeight?: number;
  dribblingWeight?: number;
  defendingWeight?: number;
  physicalWeight?: number;

  requiredSkills?: string[] | string;
  highlightedSkills?: string[] | string;

  description?: string;
}
