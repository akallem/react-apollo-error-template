import React, { useState } from "react";
import { gql, useQuery, useMutation } from "@apollo/client";

const ALL_PEOPLE = gql`
  query AllPeople {
    people {
      id
      name
    }
  }
`;

const ADD_PERSON = gql`
  mutation AddPerson($name: String) {
    addPerson(name: $name) {
      id
      name
    }
  }
`;

const EDIT_PERSON = gql`
  mutation EditPerson($id: Int, $name: String) {
    editPerson(id: $id, name: $name) {
      id
      name
    }
  }
`;

export default function App() {
  const [name, setName] = useState('');
  const [idForEdit, setIdForEdit] = useState('');
  const [nameForEdit, setNameForEdit] = useState('');
  const {
    loading,
    error,
    data,
    client,
  } = useQuery(ALL_PEOPLE);
  const now = Date.now(); // To help group logs from a single render
  console.log("Cache at top of render:", client.cache.extract(), now);
  console.log("Data at top of render:", data, now);
  console.log('Loading/error at top of render:', loading, error);
  console.log();

  const [addPerson] = useMutation(ADD_PERSON, {
    update: (cache, { data: { addPerson: addPersonData } }) => {
      const peopleResult = cache.readQuery({ query: ALL_PEOPLE });

      cache.writeQuery({
        query: ALL_PEOPLE,
        data: {
          ...peopleResult,
          people: [
            ...peopleResult.people,
            addPersonData,
          ],
        },
      });
    },
  });

  const [editPerson] = useMutation(EDIT_PERSON);

  return (
    <main>
      <h1>Apollo Client Issue Reproduction</h1>
      <p>
        This application can be used to demonstrate an error in Apollo Client.
      </p>
      <div className="add-person">
        <label htmlFor="name">Name</label>
        <input 
          type="text" 
          name="name" 
          value={name}
          onChange={evt => setName(evt.target.value)}
        />
        <button
          onClick={() => {
            addPerson({ variables: { name } });
            setName('');
          }}
        >
          Add person
        </button>
      </div>
      <br />
      <br />
      <div className="add-person">
        <label htmlFor="name">Edit Name</label>
        <input 
          placeholder="Person ID"
          type="text" 
          name="id" 
          value={idForEdit}
          onChange={evt => setIdForEdit(evt.target.value)}
        />
        <input 
          placeholder="Name"
          type="text" 
          name="name" 
          value={nameForEdit}
          onChange={evt => setNameForEdit(evt.target.value)}
        />
        <button
          onClick={() => {
            console.log("Cache before writeFragment:", client.cache.extract());
            client.cache.writeFragment({
              id: client.cache.identify({ id: Number(idForEdit), __typename: "Person" }),
              fragment: gql`
                fragment setName on Person {
                  name
                }
              `,
              data: {
                name: nameForEdit,
              },
            });
            console.log("Cache after writeFragment:", client.cache.extract());

            editPerson({
              variables: { id: Number(idForEdit), name: nameForEdit },
            });
          }}
        >
          Edit person's name
        </button>
      </div>

      <h2>Names</h2>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <ul>
          {data?.people.map(person => (
            <li key={person.id}>{person.name}</li>
          ))}
        </ul>
      )}
    </main>
  );
}
