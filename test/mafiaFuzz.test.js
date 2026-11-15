const chai = require("chai");
const expect = chai.expect;
const path = require("path");
const fs = require("fs");

const {
  verifyRole,
  areModifiersCompatible,
} = require("../modules/setupRoleValidation");
const {
  random,
  generate,
  selections,
} = require("../scripts/mafia-fuzz/generator");
const { runCase } = require("../scripts/mafia-fuzz/run");

describe("Mafia Fuzzer Test Suite", function () {
  this.timeout(30000);

  describe("1. Legal combinations and role/modifier validation", function () {
    it("validates basic Mafia roles without modifiers", function () {
      expect(verifyRole("Villager", "Mafia")).to.be.true;
      expect(verifyRole("Mafioso", "Mafia")).to.be.true;
      expect(verifyRole("Doctor", "Mafia")).to.be.true;
      expect(verifyRole("Cop", "Mafia")).to.be.true;
    });

    it("rejects non-existent roles", function () {
      expect(verifyRole("NonExistentRoleXYZ", "Mafia")).to.be.false;
      expect(verifyRole("", "Mafia")).to.be.false;
      expect(verifyRole("Villager", "NonExistentGameType")).to.be.false;
    });

    it("enforces alignment matching when specified", function () {
      expect(verifyRole("Villager", "Mafia", "Village")).to.be.true;
      expect(verifyRole("Villager", "Mafia", "Mafia")).to.be.false;
      expect(verifyRole("Mafioso", "Mafia", "Mafia")).to.be.true;
      expect(verifyRole("Mafioso", "Mafia", "Village")).to.be.false;
    });

    it("validates single compatible modifier on a role", function () {
      expect(verifyRole("Doctor:Bulletproof", "Mafia")).to.be.true;
      expect(verifyRole("Villager:Caffeinated", "Mafia")).to.be.true;
    });

    it("validates multiple compatible modifiers", function () {
      expect(verifyRole("Doctor:Bulletproof/Caffeinated", "Mafia")).to.be.true;
    });

    it("rejects unknown modifiers", function () {
      expect(verifyRole("Doctor:NonExistentModXYZ", "Mafia")).to.be.false;
      expect(verifyRole("Villager:Bulletproof/FakeModifier", "Mafia")).to.be.false;
    });

    it("rejects incompatible modifiers via areModifiersCompatible", function () {
      // In Mafia modifiers, check an incompatible pair like Inclusive and Exclusive
      const incompatiblePair = areModifiersCompatible("Mafia", "Inclusive/Exclusive");
      expect(incompatiblePair).to.be.false;
      expect(verifyRole("Doctor:Inclusive/Exclusive", "Mafia")).to.be.false;
    });

    it("handles duplicate modifiers based on allowDuplicate flag", function () {
      // Bulletproof has allowDuplicate: true
      expect(areModifiersCompatible("Mafia", "Bulletproof/Bulletproof")).to.be.true;
      // Apprehensive does not allow duplicates
      expect(areModifiersCompatible("Mafia", "Apprehensive/Apprehensive")).to.be.false;
      expect(verifyRole("Doctor:Apprehensive/Apprehensive", "Mafia")).to.be.false;
    });

    it("areModifiersCompatible handles invalid inputs gracefully", function () {
      expect(areModifiersCompatible("InvalidGameType", "Bulletproof")).to.be.false;
      expect(areModifiersCompatible("Mafia", null)).to.be.false;
      expect(areModifiersCompatible("Mafia", 123)).to.be.false;
      expect(areModifiersCompatible("Mafia", "NonExistentMod1/NonExistentMod2")).to.be.false;
    });

    it("generate() creates valid setups where all roles pass verifyRole", function () {
      for (let seed = 1; seed <= 10; seed++) {
        const setup = generate(seed, 3);
        expect(setup).to.be.an("object");
        expect(setup.total).to.be.at.least(5).and.at.most(10);
        expect(setup.roles).to.be.an("array").with.lengthOf(1);

        const roleset = setup.roles[0];
        let roleCount = 0;
        for (const [roleName, count] of Object.entries(roleset)) {
          expect(count).to.be.at.least(1);
          roleCount += count;
          expect(verifyRole(roleName, "Mafia"), `Role ${roleName} should be valid`).to.be.true;
        }
        expect(roleCount).to.equal(setup.total);
      }
    });
  });

  describe("2. Action selection logic", function () {
    const rng = random(42);

    it("returns empty array when member cannot vote", function () {
      expect(selections({ voting: false, canVote: true, canUpdateVote: true, targets: ["user1"] }, {}, rng)).to.deep.equal([]);
      expect(selections({ voting: true, canVote: false, canUpdateVote: true, targets: ["user1"] }, {}, rng)).to.deep.equal([]);
      expect(selections({ voting: true, canVote: true, canUpdateVote: false, targets: ["user1"] }, {}, rng)).to.deep.equal([]);
    });

    it("generates fuzz text for text inputType", function () {
      const info = { voting: true, canVote: true, canUpdateVote: true, inputType: "text" };
      const sels = selections(info, {}, rng);
      expect(sels).to.be.an("array").with.lengthOf(1);
      expect(sels[0]).to.match(/^fuzz \d+$/);
    });

    it("returns empty array when targets array is empty or not an array", function () {
      expect(selections({ voting: true, canVote: true, canUpdateVote: true, targets: [] }, {}, rng)).to.deep.equal([]);
      expect(selections({ voting: true, canVote: true, canUpdateVote: true, targets: null }, {}, rng)).to.deep.equal([]);
    });

    it("selects exactly 1 target for single-choice meetings", function () {
      const targets = ["user1", "user2", "user3"];
      const info = { voting: true, canVote: true, canUpdateVote: true, multi: false, targets };
      const sels = selections(info, { multiMax: 1, multiMin: 1 }, rng);
      expect(sels).to.be.an("array").with.lengthOf(1);
      expect(targets).to.include(sels[0]);
    });

    it("selects between multiMin and multiMax for multi-target meetings", function () {
      const targets = ["u1", "u2", "u3", "u4", "u5"];
      const info = { voting: true, canVote: true, canUpdateVote: true, multi: true, targets };
      const meeting = { multiMin: 2, multiMax: 4 };
      const sels = selections(info, meeting, rng);
      expect(sels.length).to.be.at.least(2).and.at.most(4);
      sels.forEach((s) => expect(targets).to.include(s));
    });

    it("is deterministic with the same random seed", function () {
      const info = { voting: true, canVote: true, canUpdateVote: true, multi: true, targets: ["a", "b", "c", "d"] };
      const meeting = { multiMin: 1, multiMax: 3 };
      const res1 = selections(info, meeting, random(123));
      const res2 = selections(info, meeting, random(123));
      expect(res1).to.deep.equal(res2);
    });
  });

  describe("3. Crash capture", function () {
    it("captures thrown worker errors and returns failure status", async function () {
      // Create a mock worker with error reporting matching worker.js contract
      const mockWorkerPath = path.join(__dirname, "mockCrashWorker.js");
      fs.writeFileSync(
        mockWorkerPath,
        `let report = { status: "running" };
         function fail(err) {
           report.status = "failure";
           report.error = err?.stack || String(err);
           if (process.send) process.send(report, () => process.exit(1));
           else process.exit(1);
         }
         process.on("uncaughtException", fail);
         process.on("message", () => {
           throw new Error("Simulated harness engine crash");
         });`
      );

      try {
        const input = { version: 1, seed: 999 };
        const result = await runCase(input, 5000, mockWorkerPath);
        expect(result.status).to.equal("failure");
        expect(result.error).to.include("Simulated harness engine crash");
      } finally {
        if (fs.existsSync(mockWorkerPath)) fs.unlinkSync(mockWorkerPath);
      }
    });
  });

  describe("4. Timeout enforcement", function () {
    it("kills hanging worker and returns failure with timeout error", async function () {
      const mockHangWorkerPath = path.join(__dirname, "mockHangWorker.js");
      fs.writeFileSync(
        mockHangWorkerPath,
        `process.on("message", () => {
           // Do nothing, simulate hanging indefinitely
         });`
      );

      try {
        const input = { version: 1, seed: 888 };
        const result = await runCase(input, 150, mockHangWorkerPath);
        expect(result.status).to.equal("failure");
        expect(result.error).to.include("Worker exceeded 150ms");
      } finally {
        if (fs.existsSync(mockHangWorkerPath)) fs.unlinkSync(mockHangWorkerPath);
      }
    });
  });

  describe("5. Reproducible replay", function () {
    it("reproduces identical state and action traces for the same seed", async function () {
      const seed = 1;
      const setup = generate(seed, 3);
      const input = { version: 1, seed, setup, maxSteps: 5 };

      const run1 = await runCase(input, 15000);
      const run2 = await runCase(input, 15000);

      expect(run1.status).to.equal(run2.status);
      expect(run1.states).to.deep.equal(run2.states);
      expect(run1.trace).to.deep.equal(run2.trace);
      expect(run1.states.length).to.be.at.least(1);
      expect(run1.trace.length).to.be.at.least(1);
    });
  });
});
