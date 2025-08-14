import { describe, it, expect } from 'vitest';
import { websocketService } from '../../services/websocketService';

describe('websocketService minimal client-side behaviors', () => {
  it('generates and persists stableId for identifyAsPlayer', () => {
    localStorage.clear();
    websocketService['clientType'] = 'player';
    // @ts-expect-error access private
    websocketService.identifyAsPlayer();
    const id = localStorage.getItem('kj_nomad_player_id');
    expect(id).toMatch(/^pl_/);
  });
});


