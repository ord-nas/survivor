
// TODO FIXME
const all_players = [
  "Ryan T",
  "David Santana",
  "Marcus",
  "Zachary",
  "Bryan",
  "Matt C",
  "BERTRAND",
  "Dawson",
  "Deret",
  "John Silva",
  "Vincent",
  "Benj",
  "Grady Williams",
  "Sandro",
  "Ty",
  "Cody Smith",
  "Wyatt Robertson",
  "Eli",
  "Ryan Doro",
  "Patrick",
  "Matt L",
  "Yinwei",
  "Jacob",
  "Ian Nally",
  "Mitchell",
  "Mikey",
  "Dillon",
  "Alex",
];

const rubric = [
  {
    "name": "Find a Clue (for Idol or Advantage)",
    "display": "finds a Clue",
    "points": 5,
    "tags": ["idols_advantages"],
  },
  {
    "name": "Find Advantage",
    "display": "finds an Advantage",
    "points": 5,
    "tags": ["idols_advantages"],
  },
  {
    "name": "Play Advantage",
    "display": "plays an Advantage",
    "points": 10,
    "tags": ["idols_advantages"],
  },
  {
    "name": "Find Hidden Immunity Idol",
    "display": "finds a Hidden Immunity Idol",
    "points": 10,
    "tags": ["idols_advantages"],
  },
  {
    "name": "Play Hidden Immunity Idol (incorrectly)",
    "display": "plays a Hidden Immunity Idol incorrectly",
    "points": 0,
    "tags": ["idols_advantages"],
  },
  {
    "name": "Play Hidden Immunity Idol (correctly)",
    "display": "plays a Hidden Immunity Idol correctly",
    "points": 20,
    "tags": ["idols_advantages"],
  },
  {
    "name": "Go home with Idol in pocket",
    "display": "goes home with an Idol in pocket",
    "points": -25,
    "tags": ["idols_advantages"],
  },
  {
    "name": "Play Shot in the Dark corrently when needed (safe)",
    "display": "plays Shot in the Dark correctly when needed",
    "points": 30,
    "tags": ["idols_advantages"],
  },
  {
    "name": "Play Shot in the Dark corrently but not needed (not safe)",
    "display": "plays Shot in the Dark correctly but not needed (not safe)",
    "points": 5,
    "tags": ["idols_advantages"],
  },
  {
    "name": "Play Shot in the Dark incorrently (not safe)",
    "display": "plays Shot in the Dark incorrectly (not safe)",
    "points": 0,
    "tags": ["idols_advantages"],
  },
  {
    "name": "Win team reward",
    "display": "wins a team reward",
    "points": 5,
    "tags": ["challenges"],
  },
  {
    "name": "Win team immunity",
    "display": "wins team immunity",
    "points": 5,
    "tags": ["challenges"],
  },
  {
    "name": "Win individual reward",
    "display": "wins an individual reward",
    "points": 10,
    "tags": ["challenges"],
  },
  {
    "name": "Win individual immunity",
    "display": "wins individual immunity",
    "points": 15,
    "tags": ["challenges"],
  },
  {
    "name": "Sole Survivor",
    "display": "is Sole Survivor",
    "points": 50,
    "tags": ["placing"],
  },
  {
    "name": "Final 3",
    "display": "makes Final 3",
    "points": 25,
    "tags": ["placing"],
  },
  {
    "name": "Final 4",
    "display": "makes Final 4",
    "points": 25,
    "tags": ["placing"],
  },
  {
    "name": "Merge",
    "display": "makes the Merge",
    "points": 20,
    "tags": ["placing"],
  },
  {
    "name": "Tribe Swap",
    "display": "swaps tribes",
    "points": 10,
    "tags": ["placing"],
  },
  {
    "name": "Quit",
    "display": "quits",
    "points": -25,
    "tags": ["placing"],
  },
  {
    "name": "Voted out",
    "rubric_name": "Predict vote out",
    "display": "is voted out",
    "points": 25,
    "tags": ["voting"],
  },
  {
    "name": "Lost fire",
    "rubric_name": "Predict fire loser",
    "display": "lost at fire",
    "points": 25,
    "tags": ["voting"],
  },
];

// SQL events:
//     "name": "Find a Clue (for Idol or Advantage)",
//     "name": "Find Advantage",
//     "name": "Play Advantage",
//     "name": "Find Hidden Immunity Idol",
//     "name": "Play Hidden Immunity Idol (incorrectly)",
//     "name": "Play Hidden Immunity Idol (correctly)",
//     "name": "Go home with Idol in pocket",
//     "name": "Play Shot in the Dark corrently when needed (safe)",
//     "name": "Play Shot in the Dark corrently but not needed (not safe)",
//     "name": "Play Shot in the Dark incorrently (not safe)",
//     "name": "Win team reward",
//     "name": "Win team immunity",
//     "name": "Win individual reward",
//     "name": "Win individual immunity",
//     "name": "Sole Survivor",
// N/A "name": "Final 3"
// N/A "name": "Final 4"
//     "name": "Merge", global, sets nothing
//     "name": "Tribe Swap", sets FromTribe, sets ToTribe
//     "name": "Quit",
//     "name": "Predict vote out", sets Player
//     "name": "Predict fire loser", sets Player
//     "name": "Voted out"
//     "name": "Lost fire"
//
//     "name": "Select Sole Survivor", sets Player
//
//     "name": "Set epsiode metadata"

function GetEpisodeMetadatas(events) {
  var episode_to_data = new Map();
  for (const e of events) {
    if (e.EventName === "Set episode metadata") {
      episode_to_data.set(e.Episode, e);
    }
  }
  return episode_to_data;
}

function GetRubricEntry(event_name) {
  for (const r of rubric) {
    if (r.name === event_name) {
      return r;
    }
  }
  return null;
}

// Things in a score stream item are:
// * The db event
// * The rubric entry
// * The points
// * The display text
// * The set of players to award to
// * The set of sole survivors to award to

function GenerateScoreStream(state) {
  const all_survivors = state.survivors;
  const events = state.events;

  // Make a map of episode -> player -> survivors for vote out predictions.
  var episode_to_votes = new Map();
  for (const e of events) {
    if (e.EventName === "Predict vote out" || e.EventName == "Predict fire loser") {
      if (!episode_to_votes.has(e.Episode)) {
        episode_to_votes.set(e.Episode, new Map());
      }
      var player_to_survivors = episode_to_votes.get(e.Episode);
      if (!player_to_survivors.has(e.Player)) {
        player_to_survivors.set(e.Player, []);
      }
      player_to_survivors.get(e.Player).push(e.Survivor);
    }
  }

  // Keep a set of active survivors.
  var active_survivors = new Set();
  for (const s of all_survivors) {
    active_survivors.add(s.Name);
  }

  // Keep a map of players to sole survivors.
  var players_to_survivors = new Map();

  // Keep a map of survivors to tribes.
  var survivors_to_tribes = new Map();
  for (const s of all_survivors) {
    survivors_to_tribes.set(s.Name, s.Tribe);
  }

  // Generate the score stream.
  var score_stream = [];
  for (const e of events) {
    // Handle book-keeping.
    if (e.EventName === "Select Sole Survivor") {
      players_to_survivors.set(e.Player, e.Survivor);
    }
    if (e.EventName === "Tribe Swap") {
      survivors_to_tribes.set(e.Survivor, e.ToTribe);
    }
    if (e.EventName === "Voted out" || e.EventName === "Lost fire" || e.EventName === "Quit") {
      active_survivors.delete(e.Survivor);
    }

    // Create score event.
    const rubric_entry = GetRubricEntry(e.EventName);
    if (rubric_entry === null) {
      continue;
    }

    if (rubric_entry.tags.includes("voting")) {
      var score_event = {};
      score_event.db_event = e;
      score_event.rubric_entry = rubric_entry;
      score_event.points = rubric_entry.points;
      score_event.display_text = e.Survivor + " " + rubric_entry.display;
      score_event.players = [];
      var votes = episode_to_votes.get(e.Episode);
      if (votes === undefined) {
        votes = [];
      }
      for (const [player, survivors] of votes) {
        if (survivors.includes(e.Survivor)) {
          score_event.players.push(player);
        }
      }
      score_event.survivors = [];
      score_stream.push(score_event);

      // Also check for special cases.
      if (active_survivors.size === 3 || active_survivors.size === 4) {
        const final_n_rubric_entry = GetRubricEntry("Final " + active_survivors.size);
        for (const active_survivor of active_survivors) {
          var score_event = {};
          score_event.db_event = e;
          score_event.rubric_entry = final_n_rubric_entry;
          score_event.points = final_n_rubric_entry.points;
          score_event.display_text = active_survivor + " " + final_n_rubric_entry.display;
          score_event.players = [];
          for (const [player, survivor] of players_to_survivors) {
            if (survivor === active_survivor) {
              score_event.players.push(player);
            }
          }
          score_event.survivors = [active_survivor];
          score_stream.push(score_event);
        }
      }
    } else if ("Survivor" in e) {
      var score_event = {};
      score_event.db_event = e;
      score_event.rubric_entry = rubric_entry;
      score_event.points = rubric_entry.points;
      score_event.display_text = e.Survivor + " " + rubric_entry.display;
      score_event.players = [];
      for (const [player, survivor] of players_to_survivors) {
        if (survivor === e.Survivor) {
          score_event.players.push(player);
        }
      }
      score_event.survivors = [e.Survivor];
      score_stream.push(score_event);
      console.log(score_stream, players_to_survivors);
    } else if ("Tribe" in e) {
      var score_event = {};
      score_event.db_event = e;
      score_event.rubric_entry = rubric_entry;
      score_event.points = rubric_entry.points;
      score_event.display_text = e.Tribe + " " + rubric_entry.display;
      score_event.players = [];
      for (const [player, survivor] of players_to_survivors) {
        if (survivors_to_tribes.get(survivor) === e.Tribe && active_survivors.has(survivor)) {
          score_event.players.push(player);
        }
      }
      score_event.survivors = [];
      for (const [survivor, tribe] of survivors_to_tribes) {
        if (tribe === e.Tribe && active_survivors.has(survivor)) {
          score_event.survivors.push(survivor);
        }
      }
      score_stream.push(score_event);
    } else if (e.EventName === "Merge") {
      for (const active_survivor of active_survivors) {
        var score_event = {};
        score_event.db_event = e;
        score_event.rubric_entry = rubric_entry;
        score_event.points = rubric_entry.points;
        score_event.display_text = active_survivor + " " + rubric_entry.display;
        score_event.players = [];
        for (const [player, survivor] of players_to_survivors) {
          if (survivor === active_survivor) {
            score_event.players.push(player);
          }
        }
        score_event.survivors = [active_survivor];
        score_stream.push(score_event);
      }
    }
  }
  return score_stream;
}

function GetSurvivorStatuses(state) {
  const events = state.events;
  const all_survivors = state.survivors;

  // Keep a map of survivor to the players that selected them as sole survivors,
  // plus current tribe assignment.
  var survivors_to_status = new Map();
  for (const s of all_survivors) {
    survivors_to_status.set(s.Name, {
      "survivor": s.Name,
      "players": [],
      "player_to_selection_episode": new Map(),
      "tribe": s.Tribe,
    });
  }
  for (const e of events) {
    if (e.EventName === "Select Sole Survivor") {
      survivors_to_status.get(e.Survivor).players.push(e.Player);
      survivors_to_status.get(e.Survivor).player_to_selection_episode.set(e.Player, e.Episode);
    } else if (e.EventName === "Voted out" || e.EventName === "Lost fire" || e.EventName === "Quit") {
      survivors_to_status.get(e.Survivor).last_episode = e.Episode;
      survivors_to_status.get(e.Survivor).elimination_method = e.EventName;
    } else if (e.EventName === "Tribe Swap") {
      survivors_to_status.get(e.Survivor).tribe = e.ToTribe;
    }
  }
  return survivors_to_status;
}

function GetSoleSurvivorInfo(state, max_episode=10000) {
  const events = state.events;
  const all_survivors = state.survivors;

  // Keep a set of active survivors.
  var active_survivors = new Set();
  for (const s of all_survivors) {
    active_survivors.add(s.Name);
  }

  // Keep a map of players to sole survivors.
  var players_to_survivors = new Map();

  // Iterate the events to accumulate info.
  for (const e of events) {
    if (e.Episode > max_episode) {
      break;
    }
    if (e.EventName === "Select Sole Survivor") {
      players_to_survivors.set(e.Player, e.Survivor);
    }
    if (e.EventName === "Voted out" || e.EventName === "Lost fire" || e.EventName === "Quit") {
      active_survivors.delete(e.Survivor);
    }
  }

  // Compile.
  var result = new Map();
  for (const [player, survivor] of players_to_survivors) {
    result.set(player, {
      "survivor": survivor,
      "active": active_survivors.has(survivor),
    });
  }
  return result;
}

function GetState() {
  const url = '/state';
  return fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
        // Handle the error appropriately (e.g., display an error message)
      });
}

function GetUserState() {
  const url = '/user_state';
  return fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
        // Handle the error appropriately (e.g., display an error message)
      });
}

function createNode(node_type, html) {
  const node = document.createElement(node_type);
  node.innerHTML = html;
  return node;
}

function PointsCell(point_value, container='td', include_plus=true) {
  const td_class =
        point_value > 0 ? "points-positive"
        : point_value < 0 ? "points-negative"
        : "points-zero";
  const plus = include_plus ? "+" : "";
  const number_txt = point_value >= 0 ? (plus + point_value) : ("" + point_value);
  return `<${container} class="${td_class}">${number_txt} points</${container}>`;
}

function PlayerList(players) {
  if (players.length === 0) {
    return "nobody";
  } else if (players.length === 1) {
    return players[0];
  } else if (players.length === 2) {
    return `${players[0]} and ${players[1]}`;
  } else {
    const all_but_last = players.slice(0, -1);
    const last = players[players.length-1];
    return `${all_but_last.join(", ")}, and ${last}`;
  }
}

function AwardedCell(players) {
  return `<td>Awarded to ${PlayerList(players)}</td>`;
}

function GenerateEpisodeDiv(state, episode_number, score_stream, metadatas, pre_merge_votes, post_merge_votes) {
  const all_survivors = state.survivors;

  var score_items = score_stream.filter(s => s.db_event.Episode === episode_number);
  var metadata = metadatas.get(episode_number);

  const rows = score_items.map(s => `<tr><td>${s.display_text}</td>${PointsCell(s.points)}${AwardedCell(s.players)}</tr>`).join("\n");

  function PreMergeVoteTable() {
    const tribes = Unique(all_survivors.map(s => s.Tribe));
    const tribe_headers = tribes.map(t => `<th>${t} Vote</th>`).join("\n");
    const episode_data = pre_merge_votes.get(episode_number);
    if (episode_data === undefined || episode_data === null) return null;
    function GetPlayerVoteRow([player, predictions]) {
      const player_cell = `<td>${player}</td>`;
      const tribe_cells = [];
      for (const tribe of tribes) {
	const prediction = predictions.get(tribe) || "";
	const class_str = (prediction === episode_data.voted_out_survivor ?
			   'class="standings-positive"' :
			   "");
	tribe_cells.push(`<td ${class_str}>${prediction}</td>`);
      }
      return `<tr>${player_cell}${tribe_cells.join("")}</tr>`;
    }
    const vote_out_rows = Array.from(episode_data.player_predictions.entries()).map(GetPlayerVoteRow).join("\n");
    return `
              <table class="vote-table">
                <tr>
                  <th>Player</th>
                  ${tribe_headers}
                </tr>
                ${vote_out_rows}
              </table>
    `;
  }

  function PostMergeVoteTable() {
    const episode_data = post_merge_votes.get(episode_number);
    if (episode_data === undefined || episode_data === null) return null;
    function GetPlayerVoteRow([player, prediction]) {
      const player_cell = `<td>${player}</td>`;
      const class_str = (prediction === episode_data.voted_out_survivor ?
			 'class="standings-positive"' :
			 "");
      const prediction_cell = `<td ${class_str}>${prediction}</td>`;
      return `<tr>${player_cell}${prediction_cell}</tr>`;
    }
    const vote_out_rows = Array.from(episode_data.player_predictions.entries()).map(GetPlayerVoteRow).join("\n");
    const html = `
           <div class="item-container">
              <table class="vote-table">
                <tr>
                  <th>Player</th>
                  <th>Vote</th>
                </tr>
                ${vote_out_rows}
              </table>
              <div style="height:500px;width:500px">
                <canvas id="vote-canvas-${episode_number}"></canvas>
              </div>
           </div>
    `;
    return html;
  }

  const vote_out_table = PreMergeVoteTable() || PostMergeVoteTable() || "";

  const html = `
              <h2 id="episode${episode_number}">Episode ${episode_number}: ${metadata.EpisodeName}</h2>
              <div class="item-container">
                <img class="episode-img" src="${metadata.EpisodeImageSrc}"/>
                <div>
                  <p>Air Date: ${metadata.EpisodeAirDate}</p>
                  <p>${metadata.EpisodeDescription}</p>
                </div>
              </div>
              <table class="event-table episode-table">
                ${rows}
              </table>
              <button class="collapsible">Vote Out Predictions</button>
              <div class="collapsible-content">
              <br/>
              ${vote_out_table}
              </div>
        `;
  console.log(html);
  return createNode('div', html);
}

function GenerateEpisodeLink(episode_number) {
  const html = `<a href="#episode${episode_number}">Episode ${episode_number}</a>`;
  return createNode('li', html);
}

function AddEpisodeHtml(state, episode_number, score_stream, metadatas, pre_merge_votes, post_merge_votes, list, toc) {
  list.appendChild(GenerateEpisodeDiv(state, episode_number, score_stream, metadatas, pre_merge_votes, post_merge_votes));
  toc.appendChild(GenerateEpisodeLink(episode_number));
  var canvas = document.getElementById(`vote-canvas-${episode_number}`);
  if (canvas === null || canvas === undefined) return;
  var survivor_to_count = new Map();
  for ([player, survivor] of post_merge_votes.get(episode_number).player_predictions) {
    if (survivor === "") continue;
    const current = survivor_to_count.get(survivor) || 0;
    survivor_to_count.set(survivor, current + 1);
  }
  var chart = new Chart(canvas, {
    type: 'pie',
    data: {
      labels: Array.from(survivor_to_count.keys()),
      datasets: [
	{
	  data: Array.from(survivor_to_count.values()),
	}
      ]
    },
    options: {
      responsive: true,
      plugins: {
	legend: {
          position: 'top',
	},
	title: {
          display: true,
          text: 'Vote Distribution'
	}
      }
    },
  });
}

function StatusHtml(status) {
  return ("elimination_method" in status ?
	  `<span class="points-negative">${status.elimination_method} (Episode ${status.last_episode})</span>` :
	  `<span class="points-positive">Still playing</span>`);
}

function GenerateSurvivorDiv(state, survivor_number, score_stream, survivor_statuses) {
  const all_survivors = state.survivors;
  const survivor = all_survivors[survivor_number];
  const status = survivor_statuses.get(survivor.Name);
  console.log(survivor_statuses, survivor, survivor.Name);
  var score_items = score_stream.filter(s => s.survivors.includes(survivor.Name));
  var total_score = score_items.reduce((accumulator, s) => accumulator + s.points, 0);
  const rows = score_items.map(s => `<tr><td>Episode ${s.db_event.Episode}</td><td>${s.display_text}</td>${PointsCell(s.points)}</tr>`).join("\n");
  const html = `
              <h2 id="survivor${survivor_number}">${survivor.FullName}</h2>
              <div class="item-container">
                <img class="survivor-img"/>
                <div>
                  <p>Tribe: ${survivor.Tribe}</p>
                  <p>Status: ${StatusHtml(status)}</p>
                  <p>Total points: ${PointsCell(total_score, container='span', include_plus=false)}</p>
                  <p>Sole Survivor for: ${PlayerList(status.players)}</p>
                  <p>Age: ${survivor.Age}</p>
                  <p>Hometown: ${survivor.Hometown}</p>
                  <p>Residence: ${survivor.Residence}</p>
                  <p>Occupation: ${survivor.Occupation}</p>
                </div>
              </div>
              <table class="event-table survivor-table">
                ${rows}
              </table>
        `;
  console.log(html);
  var node = createNode('div', html);
  var img = node.querySelector(".survivor-img");
  if ("elimination_method" in status) {
    img.onload = function() {
      // Create a canvas element
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.style.position = 'absolute';
      canvas.style.left = '0';
      canvas.style.top = '0';
      img.parentNode.insertBefore(canvas, img.nextSibling); // Insert canvas after the image

      // Get the canvas context
      const ctx = canvas.getContext('2d');

      // Draw a red 'X'
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(canvas.width, canvas.height);
      ctx.moveTo(canvas.width, 0);
      ctx.lineTo(0, canvas.height);
      ctx.stroke();
    };
  }
  img.src = survivor.ImageSrc;
  return node;
}

function GenerateSurvivorLink(state, survivor_number) {
  const all_survivors = state.survivors;
  const survivor = all_survivors[survivor_number];
  const html = `<a href="#survivor${survivor_number}">${survivor.Name}</a>`;
  return createNode('li', html);
}

function AddSurvivorHtml(state, survivor_number, score_stream, survivor_statuses, list, toc) {
  list.appendChild(GenerateSurvivorDiv(state, survivor_number, score_stream, survivor_statuses));
  toc.appendChild(GenerateSurvivorLink(state, survivor_number));
}

function GetSurvivorStatusForPlayer(survivor_statuses, player_name) {
  var matching_statuses = Array.from(survivor_statuses.values()).filter(s => s.players.includes(player_name));
  if (matching_statuses.length === 0) return null;
  return matching_statuses[0];
}

function Unique(arr) {
  const seen = new Set();
  const result = [];

  for (const item of arr) {
    if (!seen.has(item)) {
      seen.add(item);
      result.push(item);
    }
  }

  return result;
}

function SurvivorByName(state, name) {
  const all_survivors = state.survivors;
  for (var survivor of all_survivors) {
    if (survivor.Name === name) {
      return survivor;
    }
  }
  return null;
}

function GeneratePlayerDiv(state, player_number, score_stream, survivor_statuses, pre_merge_votes, post_merge_votes) {
  const all_survivors = state.survivors;
  const player = state.players[player_number];
  const status = GetSurvivorStatusForPlayer(survivor_statuses, player);
  console.log("GetSurvivorStatusForPlayer", survivor_statuses, player, status);
  var score_items = score_stream.filter(s => s.players.includes(player));
  var total_score = score_items.reduce((accumulator, s) => accumulator + s.points, 0);
  const rows = score_items.map(s => `<tr><td>Episode ${s.db_event.Episode}</td><td>${s.display_text}</td>${PointsCell(s.points)}</tr>`).join("\n");

  const pre_merge_vote_table = (function() {
    const tribes = Unique(all_survivors.map(s => s.Tribe));
    const tribe_headers = tribes.map(t => `<th>${t} Vote</th>`).join("\n");
    function GetEpisodeVoteRow([episode, data]) {
      const episode_cell = `<td>${episode}</td>`;
      const tribe_cells = [];
      const predictions = data.player_predictions.get(player);
      for (const tribe of tribes) {
	const prediction = predictions.get(tribe) || "";
	const class_str = (prediction === data.voted_out_survivor ?
			   'class="standings-positive"' :
			   tribe === data.voted_out_tribe ?
			   'class="standings-negative"' :
			   "");
	tribe_cells.push(`<td ${class_str}>${prediction}</td>`);
      }
      return `<tr>${episode_cell}${tribe_cells.join("")}<td>${data.voted_out_survivor}</td></tr>`;
    }
    const vote_out_rows = Array.from(pre_merge_votes.entries()).map(GetEpisodeVoteRow).join("\n");
    return `
              <table class="vote-table">
                <tr>
                  <th>Episode</th>
                  ${tribe_headers}
                  <th>Actual</th>
                </tr>
                ${vote_out_rows}
              </table>
    `;
  })();

  const post_merge_vote_table = (function() {
    function GetEpisodeVoteRow([episode, data]) {
      const episode_cell = `<td>${episode}</td>`;
      const prediction = data.player_predictions.get(player) || "";
      const class_str = (prediction === data.voted_out_survivor ?
			 'class="standings-positive"' :
			 'class="standings-negative"');
      const prediction_cell = `<td ${class_str}>${prediction}</td>`;
      return `<tr>${episode_cell}${prediction_cell}<td>${data.voted_out_survivor}</td></tr>`;
    }
    const vote_out_rows = Array.from(post_merge_votes.entries()).map(GetEpisodeVoteRow).join("\n");
    return `
              <table class="vote-table">
                <tr>
                  <th>Episode</th>
                  <th>Vote</th>
                  <th>Actual</th>
                </tr>
                ${vote_out_rows}
              </table>
    `;
  })();

  const survivor_headshot = (
      status === null ?
	"" :
	'<div class="sole-survivor-headshot"></div>');
  const spacer = (status === null ? "" : "<br/><br/>");
  const sole_survivor_html =
	(status === null ?
	 "Not selected" :
	 `${status.survivor} (selected before episode ${status.player_to_selection_episode.get(player)})`);
  const html = `
              <h2 id="player${player_number}">${player}</h2>
              <div class="item-container">
                ${survivor_headshot}
                <div>
                  ${spacer}
                  <p>Total points: ${PointsCell(total_score, container='span', include_plus=false)}</p>
                  <p>Sole Survivor: ${sole_survivor_html}</p>
                  <p>Sole Survivor status: ${status === null ? "N/A" : StatusHtml(status)}</p>
                </div>
              </div>
              <table class="event-table player-table">
                ${rows}
              </table>
              <br/>
              <button class="collapsible">Vote Out Predictions</button>
              <div class="collapsible-content">
              <p>Pre-merge vote predictions:</p>
              ${pre_merge_vote_table}
              <p>Post-merge vote predictions:</p>
              ${post_merge_vote_table}
              </div>
              <br/>
              <button class="collapsible">Score History</button>
              <div class="collapsible-content" style="height:500px;width:700px">
                <canvas class="score-history-chart"></canvas>
              </div>

        `;
  var node = createNode('div', html);
  if (status !== null) {
    const survivor = SurvivorByName(state, status.survivor);
    const headshot_div = GenerateHeadshotDivForTribe(survivor, score_stream, survivor_statuses, extra_info=false);
    node.querySelector(".sole-survivor-headshot").replaceWith(headshot_div);
  }
  return node;
}

function GeneratePlayerLink(player_number, player) {
  const html = `<a href="#player${player_number}">${player}</a>`;
  return createNode('li', html);
}

function AddPlayerHtml(state, player_number, score_stream, survivor_statuses, pre_merge_votes, post_merge_votes, standings, list, toc) {
  var player = state.players[player_number];
  const player_div = GeneratePlayerDiv(state, player_number, score_stream, survivor_statuses, pre_merge_votes, post_merge_votes);
  list.appendChild(player_div);
  toc.appendChild(GeneratePlayerLink(player_number, player));
  var canvas = player_div.querySelector(".score-history-chart");
  if (canvas === null || canvas === undefined) return;
  var info = null;
  for (var standing of standings) {
    if (standing.player === player) {
      info = standing;
      break;
    }
  }
  if (info === null) return;
  const N = info.points_per_episode_voting.length;
  var cumulative_voting = new Array(N).fill(0);
  var cumulative_sole_survivor = new Array(N).fill(0);
  var episodes = [];
  for (var i = 1; i < N; i += 1) { // Okay to skip zero since 0th index ignored.
    cumulative_voting[i] = cumulative_voting[i-1] + info.points_per_episode_voting[i];
    episodes.push(i);
  }
  for (var i = 1; i < N; i += 1) { // Okay to skip zero since 0th index ignored.
    cumulative_sole_survivor[i] = cumulative_sole_survivor[i-1] + info.points_per_episode_sole_survivor[i];
  }
  var chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: episodes,
      datasets: [
	{
	  label: 'Sole Survivor',
	  data: cumulative_sole_survivor.slice(1),
	  fill: true
	},
	{
	  label: 'Voting',
	  data: cumulative_voting.slice(1),
	  fill: true
	},
      ]
    },
    options: {
      responsive: true,
      plugins: {
	tooltip: {
          mode: 'index'
	},
      },
      interaction: {
	mode: 'nearest',
	axis: 'x',
	intersect: false
      },
      scales: {
	x: {
          title: {
            display: true,
            text: 'Episode'
          }
	},
	y: {
          stacked: true,
          title: {
            display: true,
            text: 'Score'
          }
	}
      }
    }
  });
}

function GeneratePreMergeVoteOutPredictions(state) {
  const events = state.events;
  const all_survivors = state.survivors;

  const episodes = events.map(e => "Episode" in e ? e.Episode : 0);
  var num_episodes = Math.max(...episodes);
  for (const e of events) {
    if (e.EventName === "Merge") {
      num_episodes = e.Episode;
    }
  }

  function GenerateNullPredictions() {
    var player_to_predictions = new Map();
    for (const player of state.players) {
      player_to_predictions.set(player, new Map());
    }
    return player_to_predictions;
  }

  var episode_to_data = new Map();
  for (var i = 1; i <= num_episodes; i += 1) {
    episode_to_data.set(i, {
      "voted_out_survivor": null,
      "voted_out_tribe": null,
      "player_predictions": GenerateNullPredictions(),
    });
  }

  // Keep a map of survivors to tribes.
  var survivors_to_tribes = new Map();
  for (const s of all_survivors) {
    survivors_to_tribes.set(s.Name, s.Tribe);
  }

  for (const e of events) {
    if (e.EventName === "Tribe Swap") {
      survivors_to_tribes.set(e.Survivor, e.ToTribe);
    }
    if (e.Episode > num_episodes) {
      break;
    }
    if (e.EventName === "Predict vote out" || e.EventName == "Predict fire loser") {
      const tribe = survivors_to_tribes.get(e.Survivor);
      episode_to_data.get(e.Episode).player_predictions.get(e.Player).set(tribe, e.Survivor);
    }
    if (e.EventName === "Voted out" || e.EventName === "Lost fire") {
      const tribe = survivors_to_tribes.get(e.Survivor);
      episode_to_data.get(e.Episode).voted_out_survivor = e.Survivor;
      episode_to_data.get(e.Episode).voted_out_tribe = tribe;
    }
  }

  return episode_to_data;
}

function GeneratePostMergeVoteOutPredictions(state) {
  const events = state.events;

  const episodes = events.map(e => "Episode" in e ? e.Episode : 0);
  var num_episodes = Math.max(...episodes);
  var merge_episode = null;
  for (const e of events) {
    if (e.EventName === "Merge") {
      merge_episode = e.Episode;
    }
  }

  if (merge_episode === null) {
    return new Map();
  }

  function GenerateNullPredictions() {
    var player_to_prediction = new Map();
    for (const player of state.players) {
      player_to_prediction.set(player, "");
    }
    return player_to_prediction;
  }

  var episode_to_data = new Map();
  for (var i = merge_episode + 1; i <= num_episodes; i += 1) {
    episode_to_data.set(i, {
      "voted_out_survivor": null,
      "player_predictions": GenerateNullPredictions(),
    });
  }

  for (const e of events) {
    if (e.Episode <= merge_episode) {
      continue;
    }
    if (e.EventName === "Predict vote out" || e.EventName == "Predict fire loser") {
      episode_to_data.get(e.Episode).player_predictions.set(e.Player, e.Survivor);
    }
    if (e.EventName === "Voted out" || e.EventName === "Lost fire") {
      episode_to_data.get(e.Episode).voted_out_survivor = e.Survivor;
    }
  }

  return episode_to_data;
}

function GenerateStandings(state, score_stream, max_episode=10000) {
  const events = state.events;

  const sole_survivor_info = GetSoleSurvivorInfo(state, max_episode);
  const score_items = score_stream.filter(s => s.db_event.Episode <= max_episode);
  const episodes = events.map(e => "Episode" in e ? e.Episode : 0);
  const num_episodes = Math.min(max_episode, Math.max(...episodes));
  const num_vote_outs = score_items.filter(s => s.rubric_entry.tags.includes("voting")).length;

  var player_to_standing = new Map();
  for (const player of state.players) {
    player_to_standing.set(player, {
      "player": player,
      "sole_survivor_info": sole_survivor_info.get(player), // May be undefined
      "points": 0,
      "pre_merge_challenge": 0,
      "post_merge_challenge": 0,
      "clues_idols": 0,
      "placing": 0,
      "vote_out": 0,
      "points_per_episode": new Array(num_episodes+1).fill(0),  // 0th index ignored!
      "points_per_episode_voting": new Array(num_episodes+1).fill(0),  // 0th index ignored!
      "points_per_episode_sole_survivor": new Array(num_episodes+1).fill(0),  // 0th index ignored!
      "points_per_vote_out": new Array(num_vote_outs).fill(0),
    });
  }

  var vote_out_order = new Array(num_vote_outs).fill("");
  var current_vote_out = 0;
  var merge = false;
  for (s of score_items) {
    for (p of s.players) {
      var standing = player_to_standing.get(p);
      standing.points += s.points;
      standing.points_per_episode[s.db_event.Episode] += s.points;

      if (s.rubric_entry.tags.includes("voting")) {
	standing.points_per_episode_voting[s.db_event.Episode] += s.points;
      } else {
	standing.points_per_episode_sole_survivor[s.db_event.Episode] += s.points;
      }

      if (s.rubric_entry.tags.includes("challenges") && !merge) {
	standing.pre_merge_challenge += s.points;
      } else if (s.rubric_entry.tags.includes("challenges") && merge) {
	standing.post_merge_challenge += s.points;
      } else if (s.rubric_entry.tags.includes("idols_advantages")) {
	standing.clues_idols += s.points;
      } else if (s.rubric_entry.tags.includes("placing")) {
	standing.placing += s.points;
      } else if (s.rubric_entry.tags.includes("voting")) {
	standing.vote_out += s.points;
	standing.points_per_vote_out[current_vote_out] += s.points;
      }
    }
    if (s.db_event.EventName === "Merge") {
      merge = true;
    }
    if (s.rubric_entry.tags.includes("voting")) {
      vote_out_order[current_vote_out] = s.db_event.Survivor;
      current_vote_out += 1;
    }
  }

  // Get all the values of the map
  var standings = Array.from(player_to_standing.values());

  // Sort the values by score, then by name
  standings.sort((a, b) => {
    if (a.points !== b.points) {
      return b.points - a.points; // Sort by score first, descending
    } else {
      return a.player.localeCompare(b.player); // If scores are equal, sort by name
    }
  });

  // Assign rank.
  var rank = 0;
  var i = 0;
  var current_points = 1000000;
  for (var standing of standings) {
    i += 1;
    if (standing.points < current_points) {
      rank = i;
      current_points = standing.points;
    }
    standing.rank = rank;
  }

  // Start building a table.
  const vote_out_headers = vote_out_order.map(s => `<th class="rotate">${s}</th>`).join("\n");
  const header = `
        <tr>
          <th>Rank</th>
          <th>Player</th>
          <th>Sole Survivor</th>
          <th>Points</th>
          <th class="rotate">Pre-Merge Challenges</th>
          <th class="rotate">Post-Merge Challenges</th>
          <th class="rotate">Clues/Idols</th>
          <th class="rotate">Champion Place</th>
          <th class="rotate">Vote Out</th>
          ${vote_out_headers}
        </tr>
  `;

  function PlayerRow(standing) {
    const survivor_info = standing.sole_survivor_info;
    const sole_survivor_cell =
	  survivor_info === undefined ?
	  `<td class="missing-sole-survivor">N/A</td>` :
	  survivor_info.active ?
	  `<td>${survivor_info.survivor}</td>` :
	  `<td class="eliminated-sole-survivor">${survivor_info.survivor}</td>`;
    const basic_cells = `
         <td>${standing.rank}</td>
         <td>${standing.player}</td>
         ${sole_survivor_cell}
         <td>${standing.points}</td>
         <td>${standing.pre_merge_challenge}</td>
         <td>${standing.post_merge_challenge}</td>
         <td>${standing.clues_idols}</td>
         <td>${standing.placing}</td>
         <td>${standing.vote_out}</td>
    `;
    const vote_out_cells = standing.points_per_vote_out.map(p => `<td>${p}</td>`).join("\n");
    return "<tr>" + basic_cells + vote_out_cells + "</tr>";
  }

  const player_rows = standings.map(PlayerRow).join("\n");

  console.log(score_items, sole_survivor_info, standings);

  const table_html = `
    <table class="standings-table">
      ${header}
      ${player_rows}
    </table>
  `;
  var table = createNode('div', table_html);

  // Add classes based on numeric values.
  var cells = Array.from(table.querySelectorAll("td"));
  for (var cell of cells) {
    if (isNaN(cell.innerHTML)) continue;
    const num = parseInt(cell.innerHTML);
    if (isNaN(num)) continue;
    if (num < 0) {
      cell.classList.add("standings-negative");
    } else if (num > 0) {
      cell.classList.add("standings-positive");
    }
  }

  return [standings, table];
}

function ActivateCollapsibles() {
  var coll = document.getElementsByClassName("collapsible");
  for (var element of coll) {
    element.addEventListener("click", function() {
      this.classList.toggle("active-collapsible");
      var content = this.nextElementSibling;
      if (content.style.maxHeight){
	content.style.maxHeight = null;
      } else {
	content.style.maxHeight = content.scrollHeight + "px";
      }
    });
  }
}

function GenerateHeadshotDivForTribe(survivor, score_stream, survivor_statuses, extra_info, selectable_if_eliminated) {
  const status = survivor_statuses.get(survivor.Name);
  var score_items = score_stream.filter(s => s.survivors.includes(survivor.Name));
  var total_score = score_items.reduce((accumulator, s) => accumulator + s.points, 0);
  const extra_info_html = extra_info ?
	`
              <p>Score: ${PointsCell(total_score, container='span', include_plus=false)}</p>
              <p>Players: ${status.players.length}</p>
        ` : "";
  const html = `
              <div class="headshot ${survivor.HeadshotClass}"></div>
              <p class="survivor-vote-name">${survivor.Name}</p>
              ${extra_info_html}
  `;
  console.log(html);
  var node = createNode('div', html);
  node.classList.add("headshot-container");
  if (selectable_if_eliminated || !("elimination_method" in status)) {
    node.classList.add("selectable");
  }
  var headshot = node.querySelector(".headshot");
  if ("elimination_method" in status) {
    const canvas = document.createElement('canvas');
    canvas.width = 104;
    canvas.height = 130;
    headshot.appendChild(canvas);

    // Get the canvas context
    const ctx = canvas.getContext('2d');

    // Draw a red 'X'
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.moveTo(canvas.width, 0);
    ctx.lineTo(0, canvas.height);
    ctx.stroke();
  }
  return node;
}

function GenerateTribeDivs(state, score_stream, survivor_statuses, extra_info=true, selectable_if_eliminated=true) {
  const events = state.events;
  const all_survivors = state.survivors;
  const tribes = state.tribes;

  // Get the current survivor to tribe associations.
  var survivors_to_tribes = new Map();
  for (const s of all_survivors) {
    survivors_to_tribes.set(s.Name, s.Tribe);
  }
  for (const e of events) {
    if (e.EventName === "Tribe Swap") {
      survivors_to_tribes.set(e.Survivor, e.ToTribe);
    }
  }

  // Start tribe to survivor map.
  const tribe_to_survivor_divs = new Map();
  const tribe_info = new Map();
  for (const tribe of tribes) {
    tribe_to_survivor_divs.set(tribe.Name, []);
    tribe_info.set(tribe.Name, tribe);
  }

  // Build the divs.
  for (var survivor of all_survivors) {
    const tribe = survivors_to_tribes.get(survivor.Name);
    tribe_to_survivor_divs.get(tribe).push(GenerateHeadshotDivForTribe(survivor, score_stream, survivor_statuses, extra_info, selectable_if_eliminated));
  }

  // Build container for each tribe.
  function BuildTribeContainer(tribe, divs) {
    const info = tribe_info.get(tribe);
    const html = `
        <h2 class="tribe-header">${tribe} (${info.FullName})</h2>
        <div class="item-container"></div>
    `;
    const node = createNode('div', html);
    node.classList.add("tribe-container");
    node.style.backgroundColor = info.Color;
    const container = node.querySelector(".item-container");
    for (const div of divs) {
      container.appendChild(div);
    }
    return node;
  }
  var tribe_containers = new Map();
  for (const [tribe, divs] of tribe_to_survivor_divs) {
    tribe_containers.set(tribe, BuildTribeContainer(tribe, divs));
  }
  return tribe_containers;
}

function GenerateSoleSurvivorDiv(state, score_stream, survivor_statuses, extra_info=true, include_eliminated=true) {
  const events = state.events;
  const all_survivors = state.survivors;

  // Build the divs.
  const divs = [];
  for (var survivor of all_survivors) {
    const status = survivor_statuses.get(survivor.Name);
    if (!include_eliminated && "elimination_method" in status) {
      continue;
    }
    divs.push(GenerateHeadshotDivForTribe(survivor, score_stream, survivor_statuses, extra_info, selectable_if_eliminated=false));
  }

  // Build container.
  const html = `
        <h2 class="tribe-header">Sole Survivor</h2>
        <div class="item-container" style="flex-wrap:wrap"></div>
    `;
  const node = createNode('div', html);
  node.classList.add("tribe-container");
  node.style.backgroundColor = "#D3D3D3";
  const container = node.querySelector(".item-container");
  for (const div of divs) {
    container.appendChild(div);
  }
  return node;
}

function AppendTribeDivs(state, score_stream, survivor_statuses, list) {
  const tribe_containers = GenerateTribeDivs(state, score_stream, survivor_statuses);
  for (const [tribe, container] of tribe_containers) {
    list.appendChild(container);
  }
}

function MakeQuestion(container, question_html, event_type) {
  container.dataset.eventType = event_type;
  const header = container.querySelector(".tribe-header");
  const question = createNode('p', question_html);
  header.parentElement.insertBefore(question, header.nextSibling);
  for (const selection of container.querySelectorAll(".selectable")) {
    selection.addEventListener("click", function() {
      const selected = selection.classList.contains("selected");
      for (const siblings of this.parentElement.querySelectorAll(".headshot-container")) {
	siblings.classList.remove("selected");
      }
      if (!selected) {
	this.classList.add("selected");
      }
    });
  }
}

function MakeStatement(container, statement_html) {
  const header = container.querySelector(".tribe-header");
  const statement = createNode('p', statement_html);
  header.parentElement.insertBefore(statement, header.nextSibling);
  container.querySelector(".item-container").remove();
}

function GetExistingVoteString(existing_votes, tribe, survivor_statuses) {
  for (const e of existing_votes) {
    if (survivor_statuses.get(e.Survivor).tribe === tribe) {
      return `You voted that ${e.Survivor} would go home from the ${tribe} tribe.`;
    }
  }
  return `You did not make a vote for the ${tribe} tribe.`;
}

function GeneratePreMergeVoteDivs(state, score_stream, survivor_statuses, sole_survivor, existing_votes, list) {
  const tribe_containers = GenerateTribeDivs(state, score_stream, survivor_statuses, extra_info=false, selectable_if_eliminated=false);
  for (const [tribe, container] of tribe_containers) {
    if (existing_votes.length === 0) {
      MakeQuestion(container, `Who do you think is going home from the ${tribe} tribe?`, "Predict vote out");
    } else {
      MakeStatement(container, GetExistingVoteString(existing_votes, tribe, survivor_statuses));
    }
    list.appendChild(container);
  }
  var sole_survivor_div = GenerateSoleSurvivorDiv(state, score_stream, survivor_statuses, extra_info=false, include_eliminated=true);
  if (sole_survivor !== "") {
    MakeStatement(sole_survivor_div, `You selected ${sole_survivor} as your Sole Survivor.`);
  } else if (existing_votes.length === 0) {
    MakeQuestion(sole_survivor_div, `Who do you want to select as your Sole Survivor?`, "Select Sole Survivor");
  } else {
    MakeStatement(sole_survivor_div, `You opted not to select a Sole Survivor in this episode.`);
  }
  list.appendChild(sole_survivor_div);
}

function GeneratePostMergeVoteDivs(state, score_stream, survivor_statuses, existing_votes, list) {
  var vote_out_div = GenerateSoleSurvivorDiv(state, score_stream, survivor_statuses, extra_info=false, include_eliminated=false);
  vote_out_div.querySelector(".tribe-header").innerHTML = "Vote Out";
  if (existing_votes.length == 0) {
    MakeQuestion(vote_out_div, `Who do you think is going home?`, "Predict vote out");
  } else {
    MakeStatement(vote_out_div, `You voted that ${existing_votes[0].Survivor} would go home this episode.`);
  }
  list.appendChild(vote_out_div);
}

function GetLastVotingStatusEvent(events) {
  var last_event = null;
  for (const e of events) {
    if (e.EventName === "Voting open" || e.EventName === "Voting closed") {
      last_event = e;
    }
  }
  return last_event;
}

function IsVoteEvent(e) {
  return (e.EventName === "Predict vote out" ||
	  e.EventName == "Predict fire loser" ||
	  e.EventName === "Select Sole Survivor");
}

function ExtractVotingResult(list){
  const questions = list.querySelectorAll(".tribe-container");
  const votes = [];
  const errors = [];
  for (const question of questions) {
    const event_type = question.dataset.eventType;
    if (event_type === null || event_type === undefined) {
      continue;
    }
    var survivor = question.querySelector(".selected")?.querySelector(".survivor-vote-name")?.innerHTML;
    if (survivor === null || survivor === undefined) {
      if (event_type === "Predict vote out") {
	const question_text = question.querySelector(".tribe-header")?.innerHTML;
	errors.push(`You must make a selection for ${question_text}.`);
      }
    } else {
      votes.push({
	event_type: event_type,
	survivor: survivor,
      });
    }
  }
  return {
    votes: votes,
    errors: errors,
  };
}

function SubmitVotes(votes, episode, player) {
  return fetch('/submit_votes', {
    method: "POST",
    body: JSON.stringify({
        episode: episode,
        player: player,
        votes: votes,
    }),
    headers: {
        "Content-type": "application/json; charset=UTF-8"
    }
  }).then(response => {
      if (!response.ok) {
	  alert("Server error");
          throw new Error('Network response was not ok');
      }
      return response.json(); // Parse the response as JSON
  }).catch(error => {
      console.error('There has been a problem with your fetch operation:', error);
      // Handle the error appropriately (e.g., display an error message)
  });
}

function RegenerateVoteDivs(player, state, score_stream, survivor_statuses, list) {
  const events = state.events;

  list.innerHTML = "";

  // Get a bunch of data needed to determine what to put on the voting page.
  const last_voting_event = GetLastVotingStatusEvent(events);
  const episode = last_voting_event === null ? 0 : last_voting_event.Episode;
  const existing_votes = events.filter(e => IsVoteEvent(e) && e.Episode === episode && e.Player === player);
  const merge = events.filter(e => e.EventName === "Merge").length > 0;
  var sole_survivor = "";
  for (const [survivor, status] of survivor_statuses) {
    if (status.players.includes(player)) {
      sole_survivor = survivor;
    }
  }

  if (last_voting_event === null || last_voting_event.EventName === "Voting closed") {
    list.innerHTML = "<p>Voting is not currently open.</p>";
    return;
  }

  if (merge) {
    GeneratePostMergeVoteDivs(state, score_stream, survivor_statuses, existing_votes, list);
  } else {
    GeneratePreMergeVoteDivs(state, score_stream, survivor_statuses, sole_survivor, existing_votes, list);
  }

  if (existing_votes.length === 0) {
    var node = createNode('div', `
        <div class="button-container">
          <div>
            <button class="action-button">Vote</button>
          </div>
        </div>`);
    var button = node.querySelector(".action-button");
    button.onclick = function() {
      const voting_result = ExtractVotingResult(list);
      console.log(voting_result);
      if (voting_result.errors.length > 0) {
	alert("Error: " + voting_result.errors.join(" "));
      } else {
	SubmitVotes(voting_result.votes, episode, player)
	    .then(unused_data => {
	      window.location.reload();
	    });
      }
    };
    list.appendChild(node);
  }

  console.log("sole_survivor", player, survivor_statuses, sole_survivor);
}

function PopulateVoterList(state, voter_list, callback) {
  var value_to_player = new Map();
  for (var player_number in state.players) {
    const player = state.players[player_number];
    const node = createNode('option', player);
    node.value = `player${player_number}`;
    voter_list.appendChild(node);
    value_to_player.set(node.value, player);
  }
  voter_list.onchange = function() {
    const value = voter_list.value;
    if (value === "none") {
      callback(null);
    } else {
      callback(value_to_player.get(value));
    }
  }
}

function GetCookie(name) {
  return document.cookie
      .split("; ")
      .find((row) => row.startsWith(name + "="))
  ?.split("=")[1];
}

function HandleDbSelection() {
  var db_selector = document.getElementById("db-selector");
  const params = new URLSearchParams(document.location.search);
  var db = params.get("db");
  if (db === null || db === undefined) {
    db = GetCookie("db");
  }
  if (db === null || db === undefined) {
    db = "real.db";
  }
  document.cookie = `db=${db};path=/`;
  db_selector.value = db;
  db_selector.onchange = function() {
      document.cookie = `db=${db_selector.value};path=/`
  };
}

function LogOut(scope) {
    return fetch('/submit_logout', {
        method: "POST",
        body: JSON.stringify({
            scope: scope,
        }),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    }).then(response => {
        if (!response.ok) {
	    alert("Server error");
            throw new Error('Network response was not ok');
        }
        return response.json(); // Parse the response as JSON
    }).catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
        // Handle the error appropriately (e.g., display an error message)
    }).then(result => {
        console.log(result);
        if (result.status === "success") {
            document.cookie = "username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            document.cookie = "session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            window.location.reload();
        }
    });
}

function PopulateAccountDiv(user_state, account_div) {
    // Check for error.
    if (user_state.status !== "success") {
        account_div.innerHTML = '<p>You are not currently logged in. <a href="login.html">Click here</a> to go to the login page.</p>';
    } else {
        account_div.innerHTML = `
          <p>Username: ${user_state.account.username}</p>
          <p>Email: ${user_state.account.email}</p>
          <div class="button-container">
            <div>
              <button class="action-button" id="log-out-local">Log Out</button>
              <button class="action-button" id="log-out-global">Log Out All Devices</button>
            </div>
          </div>
        `;
        document.getElementById("log-out-local").onclick = function() {
            LogOut("local");
        };
        document.getElementById("log-out-global").onclick = function() {
            LogOut("global");
        };
    }
}
