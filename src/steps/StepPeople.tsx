import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/layout/TopBar';
import { BottomCTA } from '../components/layout/BottomCTA';
import { Icon } from '../components/ui/Icon';
import { useBillStore } from '../store/useBillStore';
import { getAvatarGradient, getInitials } from '../utils/avatarColors';

export function StepPeople() {
  const navigate = useNavigate();
  const people = useBillStore((s) => s.people);
  const addPerson = useBillStore((s) => s.addPerson);
  const removePerson = useBillStore((s) => s.removePerson);
  const updatePerson = useBillStore((s) => s.updatePerson);
  const [inputName, setInputName] = useState('');

  const handleAdd = () => {
    const defaultName = people.length === 0 ? 'Organizer' : `Person ${people.length}`;
    const name = inputName.trim() || defaultName;
    addPerson(name);
    setInputName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  const placeholder = people.length === 0 ? 'Organizer' : `Person ${people.length}`;

  return (
    <div className="flex flex-1 flex-col">
      <TopBar title="People" />

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <h2 className="mb-2 text-center text-2xl font-extrabold text-slate-900 dark:text-white">
          Who's joining?
        </h2>
        <p className="mb-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Add everyone who's splitting the bill
        </p>

        {/* Add person input */}
        <div className="mb-6 flex gap-2">
          <input
            type="text"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
          />
          <button
            onClick={handleAdd}
            className="flex items-center gap-1 rounded-xl bg-primary px-4 py-3 font-semibold text-white transition-all active:scale-95"
          >
            <Icon name="person_add" className="text-xl" />
            Add
          </button>
        </div>

        {/* People list */}
        {people.length > 0 && (
          <>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Current squad ({people.length})
            </h3>
            <div className="space-y-2">
              {people.map((person, i) => (
                <div
                  key={person.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-800"
                >
                  {/* Avatar */}
                  <div
                    className={`flex size-10 items-center justify-center rounded-full bg-gradient-to-br ${getAvatarGradient(person.colorIndex)} text-sm font-bold text-white`}
                  >
                    {getInitials(person.name)}
                  </div>

                  {/* Name (editable) */}
                  <input
                    type="text"
                    value={person.name}
                    onChange={(e) =>
                      updatePerson(person.id, { name: e.target.value })
                    }
                    className="flex-1 border-0 bg-transparent p-0 font-semibold text-slate-900 focus:ring-0 dark:text-white"
                  />

                  {/* Organizer badge for first person */}
                  {i === 0 && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      Organizer
                    </span>
                  )}

                  {/* Remove */}
                  <button
                    onClick={() => removePerson(person.id)}
                    className="flex size-8 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  >
                    <Icon name="close" className="text-lg" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Empty state */}
        {people.length === 0 && (
          <div className="mt-8 flex flex-col items-center rounded-xl border-2 border-dashed border-slate-200 py-12 dark:border-slate-700">
            <Icon
              name="group_add"
              className="mb-3 text-5xl text-slate-300 dark:text-slate-600"
            />
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Add at least 2 people to split
            </p>
          </div>
        )}
      </div>

      <BottomCTA
        label="Choose split method"
        onClick={() => navigate('/split-method')}
        disabled={people.length < 2}
      />
    </div>
  );
}
